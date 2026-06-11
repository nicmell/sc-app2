# sc-app2 — architecture

How a knob turn in the browser becomes a UDP datagram into scsynth, and how a
scsynth reply becomes a console row, a toast, a footer reading, or a waveform.
This document traces every data path end to end: Rust backend → wire → worker
→ osc-js → stores → the leaf consumers (React components and `sc-*` Lit
elements). Companion docs: `CLAUDE.md` (working notes + conventions),
`src/lib/osc/README.md` (transport layer stack), `src/sc-elements/README.md`
(per-element docs).

## Bird's eye

```
┌─ Browser / Tauri webview ──────────────────────────────────────────────┐
│  React shell (Dashboard, overlay, toasts, footer)                      │
│  Lit sc-* elements (console, scope, strudel, plugin trees)             │
│        │ hooks / store subscriptions                                   │
│  app store: { session, osc, layout, plugins }   (reactiveStore)        │
│        │ owned by singletons                                           │
│  SessionManager ── OscClient ── ScopeController     [main thread]      │
│        │ osc-js (pack/unpack/dispatch) ── OscWorkerPlugin              │
│        │ WorkerClient (permanent worker, postMessage protocol)         │
│  ──────┼──────────────────────────────────────────────  [Web Worker]   │
│        │ createWsTransport() — the raw WebSocket                       │
└────────┼───────────────────────────────────────────────────────────────┘
         │  ws://127.0.0.1:3000/ws?session=<uuid>   (binary OSC frames)
┌────────┼─ Rust (tokio) ────────────────────────────────────────────────┐
│  axum router: /api/session /api/plugins /api/diag /ws + static assets  │
│        │ per-WS pump (select: uplink / bridge fan-out / scope poll)    │
│  Server (app logic: sessions, scope SHM handle, config)                │
│  Bridge (address-routed switch) ── Scsynth supervisor (notify/status)  │
│  Peers: UDP sockets ── scsynth :57110, strudel/SuperDirt :57120        │
│  ScopeShm: mmap of scsynth's shared-memory scope buffers               │
└─────────────────────────────────────────────────────────────────────────┘
```

Two processes talk three protocols: **HTTP** (session + plugin + diag CRUD),
**WebSocket binary frames** (raw OSC packets, unmodified in both directions),
and **UDP** (the same OSC bytes, to/from the audio peers). There is **no Tauri
IPC** — the webview is just another browser.

## Rust backend (`src-tauri/src`)

### Boot (`lib.rs`)

`run()` parses the CLI. `plugin <validate|add|remove|list>` and
`config <write|validate>` are plain filesystem commands that run and exit
before anything boots. Otherwise both run modes share `start()`:

1. `config::load` — `config.json` from `--config` or the app config dir,
   tolerant (malformed → defaults; missing/empty `peers` → seeded scsynth +
   strudel peers).
2. `Bridge::connect(&peers, connect_timeout)` — optional configured delay,
   then one connected UDP socket per peer.
3. `Scsynth::supervise(bridge)` — background registration + heartbeat.
4. **Gate**: `scsynth.await_registration()` — the HTTP listener binds only
   after the first successful `/notify` round-trip, so clients can never
   reach an API whose scsynth side hasn't come up once. Later outages are
   the supervisor's reconnect loop's problem, not boot's.
5. `Server::new(...)` → `router::listen` binds `127.0.0.1:<port>`.

GUI mode then builds the window programmatically and injects
`window.HTTP_BASE_URL` (the webview origin is `tauri://localhost`, so the
frontend needs the absolute URL); serve mode just serves. On GUI exit or
SIGINT/SIGTERM, `Server::unregister` frees every live session group and sends
`/notify 0`.

### `core/` — the OSC domain (no HTTP)

* **`osc.rs`** — thin helpers over `rosc`: `encode`, `decode_message`,
  `int_arg`, and `peek_address`, which reads a packet's address (recursing
  into a bundle's first element) **without decoding** — the routing hot path.
* **`peer.rs`** — one `Peer` per config entry: compiled routing regex,
  resolved target, a connected `UdpSocket`, and a recv task that publishes
  inbound datagrams straight onto the bridge's shared fan-out. The task
  survives transient errors (connected-UDP `ECONNREFUSED` while a peer is
  down) with a 200 ms backoff, so peers recover without restarts. A peer that
  fails setup is skipped, not fatal.
* **`bridge.rs`** — the protocol-agnostic switch. Outbound:
  `dispatch_command(bytes)` peeks the address, finds the first peer whose
  regex matches, sends (no match → warn + drop). Inbound: the single shared
  `broadcast::Sender<Bytes>` (capacity 256) the peers publish into —
  `subscribe()` hands every consumer (each WS pump, the supervisor, diag)
  its own receiver. Laggards drop frames, never block.
* **`scsynth.rs`** — protocol + supervisor + the node-id scheme.
  * Supervisor loop: `/notify 1` → the ack carries our **clientID** →
    registered; then poll `/status` at 1 Hz until 3 misses → reconnect loop
    at 1 Hz. The 1 Hz `/status.reply` is load-bearing downstream: it fans out
    to every WS client and is both the frontend's footer telemetry **and**
    its connection watchdog food.
  * Node-id scheme: scsynth gives client `cid` the id range
    `[cid<<26, (cid+1)<<26)`. We carve that into 1024 per-session sub-blocks
    of `SESSION_SPAN = 2^16` ids: `group_id = (cid<<26) + index*SPAN`, synth
    ids `group_id+1 ..`. This is why scsynth must boot with `-maxLogins ≥ 2`:
    sclang/SuperDirt occupies clientID 0; overlapping blocks would collide.
  * Group teardown helpers (`/g_freeAll` + `/n_free`) and `/notify 0`.
* **`sessions.rs`** — `SessionStore`: `Uuid → SessionBlock` plus the index
  allocator (monotonic with a free list, 1-based). Pure data structure;
  eviction is driven by the WS layer (a session ends when its socket closes).

### `server.rs` — the app-logic layer

`Server` is the axum `State` (Arc-backed, cheap clone): config + SessionStore
+ Bridge + Scsynth + the lazily-mmapped `ScopeShm`, cached per scsynth
**registration generation** — an scsynth restart recreates the segment, so the
mapping (or a cached failure) is re-derived after every re-registration
instead of pointing at a dead inode. `create_session[_with_id]` waits up to
5 s for the scsynth clientID then allocates a block; `end_session` frees the
group; a session can be **attached by at most one WebSocket** (a second tab
gets 409). Layering is one-directional: **router → server → core**, and the
router never touches `Server`'s internals.

### `router/` — HTTP + the WS pump

* **`session.rs`** — `POST /api/session` mints `{sessionId, sessionGroupId,
  nodeIdBase, nodeIdCount, scopeIndex, scsynthAddress, layout: []}`;
  `GET /api/session/{id}` returns the live session or **revives** a saved one
  under the same id (fresh block, saved layout — all fields always defined,
  `layout` `[]` when none); `PUT` persists the layout; `DELETE` ends it. 503
  "scsynth not registered" can only mean a mid-life outage (boot is gated).
* **`ws.rs`** — `/ws?session=<uuid>` validates the session then loops a
  `select!` over three sources: **uplink** binary frames (peeked: `/scope/
  subscribe|unsubscribe` are claimed for the socket-local scope subscription,
  everything else → `bridge.dispatch_command`), the **bridge fan-out**
  (every peer reply, forwarded verbatim to every socket), and a **5 ms scope
  poll** (cheap `_stage` peek; encodes + sends a `/scope/chunk` only when a
  new SHM slot landed). When the socket dies, `end_session` frees the group —
  *a session lives exactly as long as its WebSocket*.
* **`plugin.rs`** — list/add/remove plus `GET /api/plugins/{id}/{*file}`,
  serving the entry XHTML or declared assets straight out of the stored zip.
* **`diag.rs`** — `/api/diag/nodetree` (send `/g_queryTree`, await the reply
  on a fresh fan-out subscription, parse to JSON) and `/dumptree`.
* **`assets.rs`** — production-only static serving from the embedded Tauri
  assets (two `AssetResolver` impls: context for serve, app resolver for
  GUI), SPA fallback to `index.html`, loud 404s for asset-shaped misses. In
  dev both are `None` and Vite serves the UI.

### `scope/` — the SHM master-out scope

scsynth writes scope audio into a Boost.Interprocess shared-memory segment
(`SuperColliderServer_<port>`); the `ScopeOut2` UGen fills per-scope-index
triple-buffered slots. Rather than `/b_getn` OSC round-trips, the backend
mmaps the segment read-only (`shm.rs`), pattern-scans it once to locate the
`vector<offset_ptr<scope_buffer>>` index map (`find_scope_buffer_array` —
heuristic: scope_buffer-shaped headers + the longest run of offset_ptrs that
resolve to them), then each WS poll reads `_stage`, and when it advanced,
copies the completed slot's floats and encodes `/scope/chunk subId tick isGap
channels blob` (big-endian f32, channel-interleaved — the wire contract
pinned by a golden test and matched by `parseScopeChunkArgs` in
`@sc-app/server-commands`). Per-session `scopeIndex` keeps concurrent windows
on distinct buffers.

### `plugin/` — validated zip bundles

`manager.rs` is the single validation + storage path used by both the HTTP
routes and the CLI: zip → `metadata.json` (name/version/entry/assets rules)
→ entry XHTML validated against the embedded XSD (`fastxml`, pinned =0.8.0)
→ asset image sniffing (declared type must match content). Stored as
`plugins/<name>-<version>.<id>.zip` + a `plugins.json` registry. **The XSD is
the only schema gate** — the frontend re-validates semantics (binds, names)
at parse time, but tag/attribute shape is enforced here at install.

### `config/`, `saved_sessions.rs`, `logger.rs`

`config.json` = `{port, peers[{name,pattern,target}], connect_timeout,
log_dir}`; `parse` is the strict core (CLI `config validate` adds regex +
`host:port` checks), `load` the tolerant wrapper. The `scsynth` **peer name is
a contract**: `Server::scsynth_address` (footer display) and the SHM segment
name both look it up by name. Saved sessions mirror the plugin layout:
`sessions/<id>.json` (opaque layout JSON) + `sessions.json` registry.
Logging: stderr always; optional daily-rotated JSON file via
`tracing-appender` (the `Logger` guard lives in `Server` so buffered lines
flush on shutdown).

## The wire, top to bottom

| Hop | Protocol | Contract |
|---|---|---|
| store → component | reactiveStore `select` views | notify only on `Object.is` change |
| OscClient ⇄ osc-js | `OSC.Message`/`Bundle` objects | address-pattern dispatch, `*`, `open/close/error` events |
| plugin ⇄ WorkerClient | `WorkerTransport` `{open, close, send, onEvent, status}` | status numbering mirrors `OSC.STATUS`/WS readyState |
| WorkerClient ⇄ worker | `postMessage` `TransportCommand` ↓ / `TransportEvent` ↑ | inbound buffers transferred zero-copy |
| worker ⇄ Rust | WebSocket **binary frames = raw OSC packets** | bytes are never rewritten by either side |
| WS pump ⇄ peers | UDP datagrams, address-routed by regex | `/scope/*` intercepted, never routed |
| backend ⇄ scsynth SHM | mmap, read-only, triple-buffer `_stage` protocol | `/scope/chunk` args + BE f32 blob (golden-tested) |

## Frontend (`src/`)

### The transport stack (`lib/worker`, `lib/osc`)

Bottom-up, all behind the same `WorkerTransport` interface:

* **`worker/transport.ts`** — `createWsTransport()`: the raw WebSocket,
  living **inside** the worker. `open` silently disposes a previous socket;
  an orderly `close` emits nothing (see below); a real socket close carries
  `{code, reason}` up for diagnostics.
* **`worker/worker.ts`** — worker entry; verbatim relay between the
  postMessage protocol and the transport.
* **`worker/WorkerClient.ts`** — the main-thread proxy (`workerClient`
  singleton). Spawns **one permanent worker in its constructor** (respawned
  on the spot if the worker itself crashes); connections come and go over it
  via open/close commands. It synthesizes the single `close` event on an
  orderly close — the invariant being that a stale close from a dead
  connection can never arrive after a new connection's subscribers are in
  place. Tracks status from events (it can't query across the thread).
* **`osc/OscWorkerPlugin.ts`** — the osc-js Plugin contract over the
  `workerClient`; maps transport events onto osc-js's `notify` (osc-js does
  all OSC decode/dispatch on the main thread).
* **`osc/OscClient.ts`** — the app's client (`oscClient` singleton) and the
  **owner of the OSC domain**: the store's `osc` slice. On `connect(url,
  {sessionGroupId, nodeIdBase, nodeIdCount, scopeIndex})` it opens the WS,
  arms the node-id allocator, sends `/g_new` (the session group, at the tail
  of scsynth's root group), **then** flips the `connected` signal and arms
  the `/status.reply` watchdog (5 s; the bridge heartbeats at 1 s). It
  polices its own connection: a transport error on an open socket, or a
  watchdog timeout, terminates the session by closing — upper layers only
  observe the close. Its `*` subscription routes every inbound reply (see
  consumers below); `send()` guards on open, logs tx, and binary args render
  as `blob(<n>B)`.

### Stores (`stores/`, `lib/utils/reactiveStore.ts`)

One `createStore({session, osc, layout, plugins})`. Slices are writable views
over top-level keys; `select` views dedupe by `Object.is`. Singletons own
their slices (`SessionManager` → `session`, `OscClient` → `osc`,
`PluginManager`-adjacent code → `plugins`, the Dashboard → `layout`); React
reads through `useSyncExternalStore` hooks (`stores/session.ts`,
`stores/osc.ts`, `useStore`); Lit elements subscribe to the store views
directly (they live outside React's tree).

### Session lifecycle (`lib/session/SessionManager.ts`)

`main.tsx` calls `session.start()` once:

1. `localStorage["sc.session"]` → `GET /api/session/{id}` revive, else
   `POST /api/session` (fails immediately — the server only exists once
   scsynth registered).
2. `oscClient.connect(wsUrl, block)` — see above.
3. Restore the saved layout **after** connecting (mounting a panel mounts
   `<sc-plugin>`, which allocates node ids — needs the live connection);
   an empty layout never clobbers `DEFAULT_LAYOUT`.
4. Subscribe `close` → status `"error"`; start the 10 s layout autosave
   (PUT only when the layout reference changed).

`retry()` (the error modal's button) tears down (timer, subscriptions,
`oscClient.close()` — safe pre-open), resets, and re-runs `start()`; the
on-screen layout is deliberately left in place under the overlay.

### Connection state machine (what the user sees)

```
 "connecting" ──connect resolves──▶ "connected" ──close──▶ "error"
      ▲  loader (backdrop +                       modal (notice + Retry)
      │  .modal-progress)                                   │
      └────────────────────── retry() ──────────────────────┘
```

Everything funnels into **one** signal: OscClient closes itself on transport
errors and watchdog timeouts, the server closes on its side's failures, and
SessionManager maps any close to `"error"`. `ConnectionOverlay` renders the
three states; nothing behind the modal is interactive without a session.

### End-to-end traces

**Outbound command** (e.g. `<sc-plugin>` creating its group):

```
sc-plugin.firstUpdated → oscClient.nextNodeId() → oscClient.send(gNewOne(...))
  → tx appended to osc.log (sc-console re-renders) → osc-js pack
  → OscWorkerPlugin.send → workerClient.send → postMessage(transfer)
  → worker ws.send → axum ws pump → peek_address("/g_new") → Bridge
  → regex match "scsynth" peer → UDP → scsynth
```

**Inbound reply** (e.g. `/n_go`, `/fail`, `/status.reply`):

```
scsynth UDP → Peer recv task → shared broadcast (Bridge fan-out)
  → every WS pump → binary frame → worker (zero-copy)
  → plugin notify → osc-js unpack + dispatch:
      "*" → OscClient.handleReply:
            /status.reply → osc.scsynthStatus (DashboardFooter) + feed watchdog
            /fail, /late  → console.error + coalescing banner (ToastStack)
                            + rx log (sc-console)
            /scope/chunk  → skipped from the log only
            everything else → rx log
      "/scope/chunk" → ScopeController → parse → chunkRef  (no store, no React)
```

**Scope audio** (the only path that bypasses the store entirely):

```
tap synth (frontend /d_recv + /s_new at session-group tail, ScopeOut2)
  → scsynth writes SHM slot → WS pump 5ms _stage peek → slot copy
  → /scope/chunk (BE f32 blob) → ws → worker → osc-js → ScopeController
  → chunkRef.current → <sc-scope> RAF loop draws the canvas
```

~47 Hz at 1024 frames/48 kHz; the RAF loop reads a mutable ref, never state —
React/Lit render cycles are not involved per frame.

**Heartbeat & failure**:

```
supervisor /status (1 Hz) → /status.reply fan-out
  → footer CPU/SR + watchdog re-arm (5 s)
scsynth dies → replies stop → backend supervisor enters reconnect loop;
  frontend watchdog fires → banner + oscClient.close() → WS close
  → server end_session (group already gone with scsynth) → status "error"
  → retry modal; scsynth returns → supervisor re-registers → Retry works
```

**Plugin install → render**:

```
zip → POST /api/plugins (or `sc-app2 plugin add`) → manager validation
  (metadata rules → XSD on entry XHTML → image sniffing) → zip stored +
  registry → frontend refreshPlugins → plugins slice → picker
  → box assigned → PluginHost mounts <sc-plugin id=boxId>
  → fetch /api/plugins/{id}/{entry} → parse as text/xml → importNode
  → process(ctx): hydrate ids → validate() → resolveRuntime() per element
  → registry adoption (id → live element) → group /g_new
```

**Layout persistence**: grid edits → `layout` slice → 10 s autosave PUT →
`sessions/<id>.json`; next boot's revive GET returns it; the id survives in
localStorage, the *live* session does not survive the socket.

## Ownership & lifetime invariants

| Thing | Lives exactly as long as | Owner |
|---|---|---|
| WS worker | the page (respawned on crash) | `WorkerClient` |
| WebSocket connection | one session | `OscClient` (closes itself on critical failures) |
| Session (group + node-id block) | its WebSocket | Rust `Server` (ends on socket close) |
| Session **identity** + layout | until overwritten | localStorage + `sessions/<id>.json` |
| Scope tap synth + subscription | the `connected` signal | `ScopeController` (global, self-arming) |
| OSC log | the page (survives reconnects) | `OscClient` (`osc` slice, bounded 300) |
| Banners / scsynth load | one connection (reset on connect) | `OscClient` |
| Plugin zips + registry | until removed | `plugin::manager` (HTTP + CLI share it) |
| scsynth client slot | the server process (`/notify 0` on shutdown) | `Scsynth` supervisor |
