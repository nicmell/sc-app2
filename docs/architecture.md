# sc-app2 — architecture

The current architecture, end to end: how a knob turn in the browser becomes
a UDP datagram into scsynth, and how a scsynth reply becomes a console row, a
toast, a footer reading, or a waveform. Companion docs: `CLAUDE.md` (working
directives + recipes), `docs/scope.md` (the SHM scope pipeline),
`docs/clock.md` (the bridge clock), `src/lib/osc/README.md` (transport
stack), `src/sc-elements/README.md` (per-element docs).

## Bird's eye

```
┌─ Browser / Tauri webview ──────────────────────────────────────────────┐
│  React shell (Dashboard, overlay, toasts, footer, router)              │
│  Lit sc-* elements (console, scope, strudel, keyboard, plugin trees)   │
│        │ hooks / store subscriptions                                   │
│  app store: { session, osc, toasts, layout, presets, plugins }         │
│        │ owned by singletons                                           │
│  SessionManager ── OscClient                        [main thread]      │
│        │ WorkerClient (permanent worker, postMessage protocol)         │
│  ──────┼──────────────────────────────────────────────  [Web Worker]   │
│        │ codec ⇄ raw WebSocket                                         │
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

Two processes talk three protocols: **HTTP** (session + plugin + diag CRUD,
with every API error as the structured `{code, message, violations?}`
envelope), **WebSocket binary frames** (raw OSC packets, unmodified in both
directions), and **UDP** (the same OSC bytes, to/from the audio peers).

## Architecture

### Run modes

- **Native GUI** (`yarn tauri dev` / no CLI subcommand): the Rust side boots the
  embedded HTTP server first, then builds the window programmatically with an
  initialization script injecting `window.HTTP_BASE_URL = "http://127.0.0.1:<port>"`
  (the webview origin is `tauri://localhost`, so same-origin URLs don't work).
  There is **no Tauri IPC** — the webview talks plain HTTP/WS like any browser
  (the API serves permissive CORS: the webview origin — `tauri://localhost`,
  or the Vite devUrl in dev — is always cross-origin to the loopback server).
- **Serve** (`sc-app2 serve`): the same server headless; browsers are same-origin
  (or Vite-proxied in dev) and `HTTP_BASE_URL` is `""`.

### Frontend (`src/`)

```
main.tsx                 boot: register sc-* elements, render <RouterProvider/>
routes/                  the react-router DATA-MODE tree (router.tsx): ONE
                         layout route "/:sessionId?" whose loader awaits
                         initValidator() AND session resolution concurrently
                         (sessionLoader resolves stored/minted/revived ids,
                         keeps the URL truthful; init rejections aren't
                         cached). Its element Layout is the app frame
                         (ToastStack/ConnectionOverlay/loading scrim, owns
                         connect()/disconnect() on its loader data) →
                         DashboardRoute (dashboard + <Outlet/>; SettingsRoute
                         at /settings renders the drawer, open only once
                         connected — never over the scrim/error modal) and
                         PluginPage (/:sessionId/plugins/:pluginId — a
                         full-screen STANDALONE <sc-plugin> with its own
                         runtime map + scsynth group). RouteError is the
                         loader-failure modal (HttpError = session wording,
                         else the error's message; Retry = same-path replace
                         navigation, re-runs loaders)
components/              React shell: Dashboard grid, shared PluginHost (offline
                         fetch/parse/process/mount), plugin picker/list,
                         ToastStack (renders the generic toasts slice),
                         Drawer/ (the settings drawer SettingsRoute renders),
                         the connection overlay (thin status switch over the
                         ui primitives; Retry revalidates the route loaders in
                         place), ui/ (the generic primitives: Modal with
                         title/description/actions slots, LoadingOverlay)
sc-elements/             Lit elements used inside plugin HTML (per-element
                         docs: sc-elements/README.md): nodes/ (plugin/group/
                         synth), synthdef/ (synthdef/ugen), state/ (control/
                         var), inputs/ (slider/knob/checkbox/switch/select/
                         option/radio-group/radio/button/envelope), visuals/
                         (display/if/text/flex/row/col), widgets/ (strudel/
                         scope/console/keyboard). index.ts = barrel +
                         registerScElements(). internal/ is ALSO the runtime
                         (the element IS the runtime — no item structures):
                         engine/ is the parse engine (free process/
                         processChildren over a cursor ctx; ScPlugin.processRoot
                         builds the entry ctx; validation.ts = static-coercion
                         toolbox + failValidation, resolution.ts = name/scope/
                         bind resolution — plain functions); the ScElement
                         base carries the common runtime fields + hooks; the
                         category bases (sc-node/sc-state/sc-input) the
                         category props/values; each component overrides
                         resolveRuntime(), mutating the element itself.
                         Static validation AND spec data live in the shared
                         Rust sc-validate crate (authored specs/<tag>.spec.json;
                         violations carry a nested `kind` — stable kebab-case
                         code + typed payload — and 1-based attribute-precise
                         line:column; TS shapes tsify-GENERATED into the
                         committed pkg d.ts, re-exported by
                         @/lib/plugins/validate); the frontend reads the spec
                         map from the wasm module (getSpec at initValidator;
                         internal/spec.ts re-exports it + bindAttr/COMMON_ATTRS)
stores/                  the single app store + slices and React hooks
  store.ts               createStore({ session, osc, toasts, layout, presets,
                         plugins }) — the ONLY app-level store. Cross-module
                         shapes come from @/types (type-only by construction),
                         so no runtime cycle with the singletons. Plugin
                         runtime state is NOT a slice: each mounted <sc-plugin>
                         instance owns a per-instance createStore (see
                         "Runtime values" below); the presets slice holds each
                         box's HARVESTED snapshot of that store (id-keyed),
                         saved with the layout and reseeded on remount
  layout.ts / presets.ts / plugins.ts / session.ts / osc.ts / toasts.ts /
  useStore.ts
types/                   .d.ts domain shapes (type-only modules):
                         stores.d.ts (app state), api.d.ts (HTTP payloads),
                         osc.d.ts (transport), sc-elements.d.ts (JSX tags),
                         runtime.d.ts (engine types: RuntimeContext + store/prop shapes)
constants/               per-domain constants (as-const maps + defaults):
                         env (HTTP_BASE_URL), osc (timeouts/limits, scope tap),
                         session, layout (grid), routes (the ROUTES patterns),
                         sc-elements (ELEMENTS), store (SliceName), toasts
lib/                     non-React infrastructure
  expression/              the bind-expression LANGUAGE: ast (the Expr union),
                         parser (grammar: arithmetic, comparisons, ternary,
                         string literals, dotted paths incl. numeric SLOT
                         tails, FUNCTION CALLS — SC envelope constructors
                         `adsr(0.01, 0.1, 0.7, 0.3)` bridged from the
                         synthdef-compiler's env-registry + `pad()`),
                         evaluate (runtime eval, multichannel expansion,
                         NaN-guarded calls), functions (the registry),
                         literal (the STRICT static-`value` evaluator,
                         memoized), split (the paren-aware top-level comma
                         splitter every comma consumer uses)
  http/                  get/post/put/del prefixed with HTTP_BASE_URL,
                         wsUrl(), HttpError (parses the ApiError envelope —
                         {code: ApiErrorCode, message, violations?}, the
                         violations typed by the same generated shape as the
                         wasm gate; raw-text bodies fall back verbatim), and
                         the global error observer: unexpected 5xx (never 503
                         — the loaders' quiet-retry domain — never 4xx) push
                         a coalesced toast unless the call passes notify:
                         false (the rule: a dedicated error surface opts out)
  osc/                   the OSC endpoint (see lib/osc/README.md): OscClient
                         (global `oscClient`, main-thread client — owns /g_new
                         of the session group, nextNodeId allocation, the
                         `connected` signal, closes itself on critical
                         failures; plus the elements' command methods, every
                         sequenced send + reply wait: createGroup/createSynth
                         (→ /n_go, returns the node id), sendSynthDef
                         (/d_recv + embedded /sync ack), freeGroup/
                         freeSynthDef/freeSynth/setControl,
                         subscribeClock(intervalMs, cb) + clockNow()
                         (absolute-phase worker ticks, survive reconnect —
                         see clock.md), subscribeScope(…, onChunk) →
                         {subId, off} (handler registered before the send;
                         chunks dispatch by subId from handleReply) and the
                         scope-slot allocator over the session's span);
                         middleware.ts + middlewares/ observe WorkerClient
                         to own the osc slice (console log, /status.reply
                         load, clock status) and toast /fail–/late;
                         watchdog.ts owns heartbeat expiry
                         → worker/WorkerClient.ts (global `workerClient`:
                           permanent-worker proxy, respawn-on-crash + status)
                         → worker/worker.ts (Web Worker endpoint:
                           `{type:"osc", packet}` ⇄ codec ⇄ bytes; the
                           `/clock/*` estimator + tick scheduler)
                         → worker/transport.ts (raw in-worker WebSocket).
                           The binary codec dependency is worker-only.
  session/               SessionManager (global `session`): the LIVE half —
                         epoch-guarded connect(info)/disconnect() (one-tick
                         deferred for StrictMode remounts), close → conn
                         status, 10 s session-data autosave (boxes + presets)
                         on worker clock ticks;
                         resolveSession.ts: the route loaders — mint/revive
                         over HTTP, localStorage ownership, bounded 503
                         quiet-retry, the mint→redirect handoff
  scope/                 scopeTapSynthDef: the ScopeOut2 tap def, compiled per
                         (channels, chunkSize) with inBus/scopeNum as controls.
                         No controller — each <sc-scope> element owns its tap
                         through the load/unload pass
  plugins/PluginManager  plugin CRUD + entry-HTML loading over /api/plugins
  synthdef/              compileSynthDef(name, params, specs): the markup-spec →
                         SCgf compiler over @sc-app/synthdef-compiler's primitives
                         (registry, operators, encoder, graph validation). No topo
                         sort: the bind-order constraint makes DOM order a valid
                         build order. Called by sc-synthdef at /d_recv time in
                         the load pass (the parse only collects params + specs)
  strudel/               Strudel bootstrap (prebake) for sc-strudel
  utils/reactiveStore    the minimal store implementation (slices, select, subscribe)
```

Conventions: `@/` alias = `src/` (tsconfig `paths` + vite `resolve.alias`);
cross-directory imports use `@/…`, same-directory imports stay relative. Module
singletons (`oscClient`, `session`) are exported by their defining module.
ESLint (flat config, `eslint.config.js`: `@eslint/js` + `typescript-eslint`
type-checked + `react-hooks`) via `yarn lint`; Prettier (`printWidth` 100) via
`yarn format`; TypeScript strict mode.

### Session lifecycle

A **live session lives exactly as long as its WebSocket**; its **identity and
session data persist** server-side (the `SessionData` payload: the dashboard
boxes + each box's plugin presets — the mounted host's literal runtime values
keyed by element content-hash id, captured against the box's plugin id):

The URL is the session's source of truth (`/:sessionId?`); the ONE route
loader (`lib/session/resolveSession.ts` sessionLoader) owns resolution and
every localStorage write:

1. Resolution: a param-less URL replace-redirects to the stored
   `localStorage["sc.session"]` id (mints one via `POST /api/session` when
   nothing is stored); with the param the loader `GET`s that id —
   **reviving** it under the same UUID (fresh node-id block, saved data) —
   and a dead/unknown id mints fresh and replace-redirects again (the minted
   info rides a module-level handoff to the redirect target's loader, no
   re-GET). While scsynth is unregistered the server answers 503 and the
   loaders retry quietly under the connecting fallback within the
   SCSYNTH_RETRY_LIMIT budget (~5 s); exhaustion throws into RouteError,
   whose Retry is a same-path replace navigation (fresh budget).
2. Connection: Layout's effect hands the loader's SessionInfo to
   `session.connect(info)` → `oscClient.connect(wsUrl, block)` opens the WS
   (in the worker) and `/g_new`s the session group **at the tail of
   scsynth's root group 0**; synth ids come from `oscClient.nextNodeId()`
   over the server-assigned block. A WS drop flips the status slice to
   "error"; the ConnectionOverlay's Retry revalidates the loaders in place
   (new info object → reconnect; a dead session revives-or-mints). Child
   navigation never re-runs the session loader, so it never reconnects.
3. Every 10 s the SessionManager `PUT`s the session data (boxes + presets)
   to `/api/session/{id}` when either slice changed; the server stores it
   opaquely under the app data dir (see below). Presets flow back in on
   connect: the presets slice is filled BEFORE the layout, so a mounting
   PluginHost seeds its host (`resumed` on the entry ctx, claimed and
   consumed by each literal state element during resolution — unclaimed
   entries are orphans, dropped with a warning); a box whose values were
   captured against a different installed plugin id skips wholesale.
4. WS close (reload/quit) → the server ends the session and frees its group.
   Server shutdown frees all live session groups one by one, then `/notify 0`.

### Backend (`src-tauri/src/`)

Two layers: `cli/` (the argv surface, one file per command) over `core/`
(the whole application engine, incl. the axum `router/` transport, composed
by `core::start`); `lib.rs` is just the module tree + `run()`.

```
lib.rs            module tree + pub fn run() → cli::run()
cli/              mod.rs (clap definitions incl. the GLOBAL --app-dir/
                  --config/--log-dir args + the single exhaustive dispatch —
                  resolves and installs the app root, every command but the
                  GUI reports through exit_cli — and the ONE tauri
                  generate_context! site);
                  serve.rs (the headless run mode),
                  gui.rs (the Tauri run mode: window + injected base URL),
                  plugin.rs (validate|add|remove|list — validate/add take
                  any mix of zips and directories holding *.zip (flat,
                  sorted; globs via the shell): per-zip failures are logged
                  without blocking the rest, erroring only when nothing
                  succeeds), config.rs (write|validate)
core/             mod.rs also exports start(config_path, log_dir) — the ONE
                  composition root both run modes call: config load + logger
                  init (the Server owns the flush guard) + bridge → scsynth
                  supervisor → Server → router::listen
  bridge.rs       UDP peers (scsynth, strudel) ⇄ broadcast fan-out, routing
  osc.rs/peer.rs  generic OSC helpers / connected UDP peers
  scsynth.rs      protocol + supervisor: /notify registration, clientID,
                  /status heartbeat, group free helpers
  blocks.rs       the per-session id-partitioning scheme (pure math): node-id
                  sub-blocks (cid<<26 blocks, per-session SESSION_SPAN) +
                  scope-slot spans (SCOPE_SPAN of SCOPE_BUFFER_COUNT)
  clock.rs        the /clock/* wire contract — ping/pong encode/parse,
                  mirrored by server-commands' commands/clock.ts
  sessions.rs     LIVE-session store (Uuid → block, index recycling)
  layouts.rs      SAVED session data (opaque boxes + presets payload):
                  sessions.json registry + sessions/<id>.json
  server.rs       the app-logic facade the router holds as axum State:
                  session mint/revive/end, the shared scope SHM handle
  config.rs       the APP ROOT (resolve_root/set_root/root: --app-dir >
                  SC_APP_DIR > canonical; every path derives from it) +
                  config.json (port, peers, connect_timeout, log_dir)
  logger.rs       tracing to stderr + the rotated JSON file (default-ON at
                  <root>/logs)
  plugin/         zip validation (metadata, spec-gated entry, assets) +
                  plugins.json registry (manager.rs)
  scope/          scsynth SHM scope buffers → /scope/chunk frames over the
                  WS, one file per layer: mmap.rs (read-only mapping +
                  acquire reads), layout.rs (scope_buffer layout +
                  discovery), reader.rs (non-mutating slot reader), wire.rs
                  (the /scope/* contract), session.rs (per-slot cursors +
                  SessionScopes — one session's subscriptions, span gating,
                  latest-only chunk staging, owned by the WS task; ws.rs
                  stays pure transport). See docs/scope.md
  router/         axum: error.rs (the STRUCTURED ApiError envelope —
                  {code, message, violations?} JSON with stable kebab-case
                  codes — spoken by EVERY server error: handlers, ws
                  handshake rejections, unknown-/api/* fallback, malformed
                  JSON bodies via ApiJson, handler panics via
                  CatchPanicLayer; only the assets page fallback stays
                  text), session.rs (POST/GET-revive/PUT-data/DELETE),
                  ws.rs (per-socket OSC pump; /scope/* intercepted; ends the
                  session on close), plugin.rs, diag.rs, assets.rs
```

The APP ROOT — ONE directory owning `config.json`, `plugins/` +
`plugins.json`, `sessions/` + `sessions.json`, and `logs/` — is shared by
BOTH run modes. Resolution: global `--app-dir` > `SC_APP_DIR` env > the
canonical platform dir (`~/Library/Application Support/com.nicmell.scapp/`,
the installed binary's default). The repo's dev scripts (`yarn serve`,
`yarn tauri`) set `SC_APP_DIR=$PWD/appdir`, so dev/tauri/harness all share
the gitignored `<repo>/appdir` (its `config.json` is the versioned dev
config). The global `--config` and `--log-dir` flags override the root's
defaults (`<root>/config.json`; `--log-dir` > config `log_dir`,
root-relative > `<root>/logs` — file logging is default-ON).

### Backend runtime

(Narrative only; mechanism details are in the module headers —
`cargo doc --no-deps --document-private-items --open`.)

**Boot** — `core::start(config_path, log_dir)`, the one chain both run
modes call: config → logger → `Bridge` (protocol-agnostic UDP peers +
inbound broadcast fan-out) → `Scsynth` supervisor on it (`/notify`
registration for a clientID, 1 Hz `/status` heartbeat, re-registration
after `MAX_STATUS_MISSES`, `/notify 0` on shutdown) → `Server` (the
app-logic facade, axum State) → `router::listen`. The server binds WITHOUT
waiting for scsynth — session routes answer 503 (`scsynth-unregistered`)
until registration. A scsynth restart bumps the registration generation,
invalidating per-generation caches (the scope SHM mapping). GUI mode runs
the same chain, then builds the window with the bound port injected.

**Session state machine** — CREATED (`POST /api/session`: uuid + a
`blocks.rs` id-block; session data reaches `layouts.rs` only on the
client's first PUT) or REVIVED (`GET`: same uuid, FRESH block, saved data)
— not yet live either way. The WS handshake `attach`es it (unknown → 404,
already attached → 409 `session-busy`; one socket per session); from there
the session lives exactly as long as the socket: close → `end_session`
frees the group, recycles the block, forgets the live entry — the saved
data survives. Shutdown drains all live sessions, then unregisters.

**Plugin pipeline** (`plugin/manager.rs`, shared by HTTP route and CLI):
zip parse → metadata validation → entry through the sc-validate spec gate
(same wire shape as the wasm gate) → asset checks (declared vs sniffed
image type) → write `<id>.zip` + registry, dropping any prior same
name+version (upload = replace). Stateless fs over the app root — the CLI
needs no server (accepted dev-only race: both rewrite plugins.json
unlocked).

### Key constants

- HTTP server: `127.0.0.1:3000` (config.json `port`); Vite dev: `1420`.
- Peers: scsynth `127.0.0.1:57110` (`/[sngbcdpu]_*`, /notify, /status…),
  strudel/SuperDirt `127.0.0.1:57120` (`/dirt`); `/scope/*` + `/clock/*` are
  bridge-internal (never routed to a peer).
- scsynth must boot with `-maxLogins ≥ 2` (`yarn osc` does) so the bridge's
  clientID ≠ sclang's and node-id blocks don't overlap.
- Scope slots: scsynth boots 128 SHM scope buffers; each session is assigned
  an aligned span of 8 (`SCOPE_SPAN`, core/blocks.rs —
  `scopeIndexBase`/`scopeIndexCount` in the session payload). The frontend
  allocates one slot per `<sc-scope>` (`oscClient.allocScopeIndex`); the
  bridge rejects subscribes outside the session's span. One WS supports any
  number of concurrent scope subscriptions, keyed by subId.

## Workspace packages (`packages/`)

- `@sc-app/server-commands` — scsynth OSC command constructors over osc-js
  (`sNew`, `dRecv`, `gNewOne`, scope + clock vocabulary, encode/decode,
  timetags). The frontend's only OSC vocabulary.
- `@sc-app/synthdef-compiler` — SynthDef → SCgf compilation (used by lib/scope's
  tap def).
- `@sc-app/ui-components` — base styles/custom-element foundation.

## The element architecture (design invariants)

Each invariant is load-bearing for the "Migrating an sc-element" recipe in
CLAUDE.md:

1. **Attributes are reactive properties** on the components (`@property()
accessor`, lowered by `esbuild.target: "es2022"`); static validation lives
   in the shared Rust spec gate, not on the components.
2. **There are no parser-item structures — the element IS the runtime**
   (no copied props, no `type` field — the tag is the discriminant — no
   nested `runtime` object: values live flat on the component).
   The free `process(ctx)` (internal/engine/) assigns the identity + shared
   runtime core (the parent collects the element into `_scChildren` as it
   completes), then runs the ONE extension hook `resolveRuntime(ctx)` (runtime
   construction: the recursion into the sc children where the element opens a
   level — `_scChildren` is a runtime value like the rest — plus bind/reference
   resolution), mutating the component itself. Static validation happens before
   the tree reaches the engine: the shared Rust `src-tauri/crates/sc-validate`
   crate is enforced natively at upload and as wasm by `@/lib/plugins/validate` at
   `parseEntry` (multi-error, one per line). `lib/html` and
   `src/runtime/handlers.ts` are gone — the engine is the free-function
   interpreter in `internal/engine/`, and its coercion/failure + bind-resolution
   helpers are plain functions in `internal/engine/validation.ts` +
   `internal/engine/resolution.ts`, taking the element explicitly where the
   error messages need it.
3. **The `internal/` category bases** (`sc-node`, `sc-state`, `sc-input`)
   declare the per-category props + runtime fields once; concrete elements
   are mostly a small `resolveRuntime()` override composed via `super`
   (static rules live in the spec).
4. **Runtime values are live element references, not string ids**:
   `_rootScNode`/`_parentScNode`/`_scChildren` (named so because DOM
   `children` is taken), `targetScState` on inputs, and each runtime prop's
   `targets: Record<path, ScState>`. Cycle detection walks the bind graph
   through these references with no lookups; there is NO id-keyed lookup
   structure at all — access from outside the DOM goes through the mounted
   `<sc-plugin>` hosts (each parsed tree hangs off its root via
   `_scChildren`; name paths resolve with `walkPath`). Anything _persisted_
   is keyed by the deterministic content-hash element id (seeded by the
   plugin id — see contentHash.ts; per-box presets carry the store paths as
   debug metadata only), and the one in-memory id lookup is the plugin
   host's resolution-built `stateIndex` (id → live literal-state element,
   the harvest/rehydration seam); references stay in-memory runtime only.
5. **Values that duplicate a reactive prop are unified, never copied**: no
   runtime `name`/`run`. The live VALUE is the exception that settled the
   other way: `value` is the plain declarative attribute mirror everywhere
   (the synthdef collection depends on telling a missing attribute apart),
   and the live value is the element's `_state` — fed by the store for
   literal state, by the `bind:value` recompute for derived — with the
   "statechange" event as the uniform notification seam. This generalized
   into the RUNTIME PROPS (`bind:` namespace) machinery on ScElement: every
   spec attr (unless `runtime: false`) accepts a `bind:`-namespaced sibling
   holding a bind expression (`bind:min="vars.lo"`,
   `bind:icon="s1.gate ? 'stop' : 'play'"`), mutually exclusive with the
   static form, evaluated live and reactive on its sources. Entries declare
   `xmlns:bind="urn:sc-app:bind"` on the root; the runtime matches by
   QUALIFIED NAME — getAttribute("bind:min"), never getAttributeNS (the one
   portable API across happy-dom and Chrome; a bare `:value` sigil is
   impossible — not namespace-well-formed XML; a DECLARED prefix is).
   The shared Rust `sc-validate` gate is the WHOLE static contract —
   well-formedness, the XHTML namespace, attributes, content-model
   membership (leaves are strictly empty; ul/ol need an li) — at native
   upload time and as wasm in the frontend at `parseEntry`, with multi-error
   messages joined one per line.
6. **The parse context is a CURSOR and the engine recurses**: the free
   `process(ctx)` (internal/engine/) works on `ctx.siblings[ctx.index]`,
   threading `{rootNode, nodes: Set<ScElement>, siblings, index, scope,
parentNode, path}` — one shared object per sibling scope, the driver
   setting `index`; static validation already happened at parseEntry/upload, so
   it assigns identity/core and runs `resolveRuntime(ctx)` (bind/reference
   resolution; ScParent recurses via the engine's `processChildren` there,
   collecting each child into `_scChildren` as it completes). A parent collects ALL its children into
   the level scope and
   checks duplicate names BEFORE any child processes (each child mints its
   deterministic seeded path hash id as it processes), with inner-scope
   shadowing on name lookups.
7. **Bind-order constraint (ENFORCED): bind targets must be declared BEFORE
   their references in DOM order.** Elements that have not yet been
   processed cannot be referenced — `resolveNode` throws `<tag>: "name" is
referenced before it is declared` when a bind names an in-scope element
   that hasn't processed yet (a name matching nothing keeps the
   does-not-match errors), and `resolveStatePath` gives the same honest
   error when a same-scope state is bound before its declaration (it checks
   the target's full DOM children for the error text only — the partial
   `_scChildren` stays the gate). `bad-forward-ref` and
   `bad-forward-state-ref` pin the messages. Type-checked binds: an
   `sc-synth` bind must resolve to an actual `<sc-synthdef>`
   (`bad-synth-target`).
   Referencing the mid-processing ANCESTOR stays legal (it pre-registers
   before its children run), so group-scoped binds to earlier siblings work.
   Consequence: references point strictly backward, the bind graph is a DAG
   by construction, and `checkCircularBind`'s graph walk is gone — reduced
   to the self-reference rejection in `resolveStatePath` (a
   mid-processing element is not yet in its parent's `_scChildren`, so a
   self-reference surfaces in the lexical fallback / DOM probe —
   `bad-circular-bind` pins the message).
8. **Two validation gates** keep all of this honest: the shared Rust
   `sc-validate` gate (invariant 5), plus `yarn vitest run` (the ONE owner
   of the fixtures' exact messages — examples.test.ts) and the e2e suites
   pinning the frontend runtime and the full upload path in happy-dom and a
   real browser — see "Validating example plugins" in CLAUDE.md.

## Element status

| element                                                    | status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sc-plugin                                                  | functional authored/runtime root: `title`/`description` live in `metadata.json` / `PluginInfo`; React's shared PluginHost imports, offline-parses, and mounts the authored root; that host owns the plugin scsynth group (its `nodeId`) and orchestrates the load pass                                                                                                                                                                                                                                                                                            |
| sc-synthdef, sc-ugen                                       | functional: params + ugen specs collected at parse, compiled to SCgf (lib/synthdef) at /d_recv time in the load pass (oscClient.sendSynthDef awaits the embedded /sync ack), freeSynthDef on unmount                                                                                                                                                                                                                                                                                                                                                              |
| sc-synth, sc-control                                       | functional: sc-synth's required `synthdef` attribute resolves its definition; oscClient.createSynth bakes controls in (a DERIVED control bakes its computed value), gates on /n_go, and sends a post-ack catch-up /n_set for writes landing in the send→/n_go window; setValue → runtime store + setControl (/n_set); derived (`bind:value`) controls re-/n_set on recompute, coercing at the OSC boundary (strings skip the send with a warning). `run="false"` is not honored yet                                                                               |
| sc-slider, sc-knob                                         | functional: render the ui-components `<sc-base-slider>`/`<sc-base-knob>` (all base props forwarded), bound via `bind:value` on the shared `ScInput` seam — the generic runtime-prop machinery carries the read side (a plain path is WRITABLE via `commit()` on the widget's composed `input`; an EXPRESSION makes a read-only live meter; a static `value` a fixed inert widget); inert writes snap back. sc-knob is the rotary sibling (no `orientation`)                                                                                                       |
| sc-checkbox, sc-switch                                     | functional: render the ui-components `<sc-base-checkbox>`/`<sc-base-switch>` over the shared ScInput `bind:value` seam (checked ↔ 1/0); sc-switch is the toggle sibling (no `label`)                                                                                                                                                                                                                                                                                                                                                                              |
| sc-select, sc-option, sc-radio-group, sc-radio             | functional: sc-select/sc-radio-group render the ui-components `<sc-base-select>`/`<sc-base-radio-group>`, projecting each option/radio child's collected `{value,label}` into the base widgets; the shared ScInput `bind:value` seam syncs the selection and dispatches the chosen value via `commit()`. sc-option/sc-radio are pure data (consumed at parse, never live)                                                                                                                                                                                      |
| sc-display                                                 | functional: the read-only value visual — static `value` or dynamic `bind:value` expression (string ternaries included), printf `format` (also runtime-capable)                                                                                                                                                                                                                                                                                                                                                                                                    |
| sc-var                                                     | functional: live `_state` on the ScElement runtime-prop machinery (no OSC) — literal vars store-backed like controls (`value` is a non-strict vector: strings allowed), derived vars (`bind:value`) recompute element-to-element on their targets' statechange                                                                                                                                                                                                                                                                                                               |
| sc-if                                                      | functional: conditional rendering on the TRUTHINESS of the `bind:when` expression (`bind:when="osc.gate"`, `bind:when="vars.freq > 440"` — the ScElement runtime-prop machinery); a TRANSPARENT container — its contents parse into the ENCLOSING scope and are UNCONDITIONALLY live (a hidden synth keeps playing; a var keys at the enclosing path); visibility via the `hidden` attribute + sc-if.scss (display: contents / [hidden] none)                                                                                                                     |
| sc-text, sc-flex, sc-row, sc-col                           | functional visual/layout wrappers over ui-components; row/col use a native 24-track CSS Grid, with the slotted sc-col host adopting the shared static span/offset/order rules for WebKit/Tauri compatibility                                                                                                                                                                                                                                                                                                                                                      |
| sc-group                                                   | functional: its own /g_new (created BEFORE its children, which target it via `targetGroupId`; nested groups nest); unload resets flags only — the subtree dies with the plugin group's wholesale teardown; a group-level control write /n_sets the group node (scsynth fans it out to every node inside). `run="false"` is not honored yet                                                                                                                                                                                                                        |
| sc-button                                                  | functional: renders the ui-components `<sc-base-button>` over the ScInput seam; write-only — `bind:value` MUST be a plain writable path (its resolveRuntime override); a click commits `set` when given (fixed-value trigger, runtime-capable as `bind:set`) else toggles 0 ↔ 1; `label`/`icon`/`disabled` are runtime props (`bind:icon="s1.gate ? 'stop' : 'play'"`)                                                                                                                                                                                            |
| sc-console                                                 | functional leaf (the OSC console; no attributes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| sc-scope                                                   | functional + parametrized: tap props `bus`/`channels`/`frames` (the visible window in samples — default 1024, ≤ 16384) + renderer-only display props `trigger` (auto\|normal\|off — edge trigger on lane 0, lib/scope/trigger.ts), `slope`, `level`, `gain`, `layout` (overlay\|split), `range` (bipolar\|unipolar — envelopes/control taps fill the lane) — see scope.md §5. The element owns its tap (def + synth at the session-group tail + a scope slot from the session's span) through load/unload. bus-based only — the buffer-bound variant is roadmap (buffer family) |
| sc-strudel                                                 | functional + parametrized: `value` = initial pattern code; plain-path `bind:value` is two-way per keystroke, expression binds are read-only, and attribute `\\n` escapes decode to newlines; `orbit` stamps un-routed dirt events; editor mounts offline, unload stops playback                                                                                                                                                                                                                                                                                   |
| sc-keyboard                                                | functional: on-screen/tracker-row/Web MIDI piano spawning a transient voice per key from a referenced synthdef (`/s_new` into the plugin group, gate-0 release, ack-window race handling, focusout release-all); `bind:envelope` latches an Env.asArray value into each voice on the def's single array param; `freq`/`amp`/`gate` remap param names                                                                                                                                                                                            |
| sc-envelope                                                | NEW: the draggable-breakpoint envelope editor over an ordinary ARRAY-valued control/var (`bind:value` — writable plain path; Env.asArray codec in lib/synthdef/envValue.ts); gesture-frozen scale + edge pinning (no runaway feedback), `minbreakpoints`/`maxbreakpoints` lock the structure (positions stay draggable — stable `env.N` slot-lens binds), drag readout, double-click curve reset                                                                                                                                                                  |
| sc-buffer, sc-waveform (buffer-bound scope)                | **not implemented** (roadmap: buffer family)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

**The load pass**: after React connects the offline-parsed tree,
`ScPlugin.firstUpdated` kicks `reload()` — which awaits `load()`, an async walk
over `_scChildren` in strict DOM order, each child
fully awaited before the next (no reactive depsReady gates; the bind-order
constraint makes DOM order a valid dependency order, so /d_recv's ack always
precedes the dependent /s_new). The elements never touch `send`/`once`
directly — every sequenced send + its reply wait is an OscClient command
method (createGroup/createSynth/sendSynthDef/…, node ids allocated
internally), built on `oscClient.once(address, match)` (waiters matched in
`handleReply` — also the unit-test seam), registered before the send.
`unload()` walks in reverse on unmount; synth
nodes die with the plugin group's gFreeAll (no per-synth /n_free). Known
limitation: synthdef names are global to scsynth — two plugins
declaring the same name overwrite each other, and the SAME plugin mounted
twice (a dashboard box + the fullscreen PluginPage) shares one def per name:
unloading either instance /d_frees it under the other (running synths keep
playing; new /s_new — e.g. keyboard voices — fail until that instance
reloads).

**Connection lifecycle**: every mounted plugin lives with the connection —
ScPlugin subscribes to `oscClient.connected`.
A drop runs `unload()` (the exact inverse of the load pass: store
subscriptions dropped, flags/node ids reset, teardown sends silently dropped
on the dead socket) while the plugin instance's runtime store survives;
reestablishment re-runs the load pass — fresh node ids from the new session
block, and the /s_new carries the user's current values out of that store. A `loadEpoch` on the plugin root (bumped by unload/reload) invalidates
any suspended load pass, so a mid-load disconnect can't leak a stale /s_new
into the new connection. Parse failures stay permanent (`parsed` flips only
when `process()` succeeds — reload never retries them).

**Runtime values**: the RUNTIME-PROP machinery lives on `ScElement`
(internal/sc-element.ts): every spec attr not flagged `runtime: false`
accepts a `bind:`-namespaced sibling holding a bind expression
(`xmlns:bind="urn:sc-app:bind"` declared on the entry root; qualified-name
matching, canonical prefix enforced), resolved in `process()`
(the base `resolveRuntime` → `resolveBind`, per prop) into
`runtimeProps[name] = {targets, expression}`, wired in `load()`'s
synchronous prefix (drop-first re-entrancy: initial recompute + recompute on
each target's statechange), and written through `updateRuntimeValue(name,
next)` — the Object.is-guarded single writer (→ requestUpdate → the
`runtimeValueChanged` subclass hook → for the `value` prop, the non-bubbling
"statechange" CustomEvent; `onStateChange()` is the ONE subscription seam
every reader uses). `getProp` returns the live evaluated value when the
`bind:` form is present (spec-coerced), the static attribute otherwise — so
render() reads stay uniform and re-render on every recompute. The element's
`_state` (ScState) IS the `value` runtime slot. Values are `number | string`
(runtime store included): the expression engine carries single-quoted string
literals and the right-associative ternary (`gate ? 'stop' : 'play'`),
`==`/`!=` strict, `+` concatenating when either side is a string; the OSC
boundary stays numeric — `sendControl`/`getControls` coerce `Number()` and
SKIP with a console.warn on NaN, and the numeric widgets coerce in
`syncFromState`. Each mounted `<sc-plugin>` instance owns its literal
runtime state as a PER-INSTANCE store (`ScPlugin.runtime`, a plain
`createStore`; full state path "s1.freq"/"vars.a" → value), reached by every
descendant through `_rootScNode` (ScState's `#pluginRuntime` getter) — no
app-store slice, no id-namespacing, and the map's lifetime IS the element's
(GC does the unmount cleanup; a remount is a new instance with fresh-seeded
defaults). It holds ONLY the literal, user-writable
keys: ScState seeds the declarative default in the load pass (a reload keeps
user-moved values) and mirrors the store key into `_state`, so external
store writes (a second input, future presets — literal keys only, via the
mounted host → element → `.runtime`) notify
dependents through the same statechange, with no OSC. DERIVED state (a
`bind:value` expression) recomputes element-to-element — NO store key at all.
Inside ugens the SAME `bind:value` spelling is the graph-input REFERENCE the
synthdef collectors consume raw; on a synthdef PARAM it is a loud parse error.
For runtime state, the
the bind-order constraint makes the target graph a DAG resolved in DOM
order, so it settles in one pass and terminates (diamond deps can
transiently double-dispatch before converging — accepted). Derived state is
read-only: `setValue()` on it is inert, and the inputs re-read after writing
so they snap back. Writes split as `setValue()` (public, underived only —
the synthdef plane never loads, so no live writer can reach it) over
`dispatchValue()` (Object.is-vs-store guard + store write;
ScControl's override adds the /n\*set — the user-gesture WRITE path), while a
derived control's recompute /n*set lives in the `runtimeValueChanged` hook
(guarded on `runtimeProps.value` + the live-node gate, so external store
writes stay UI-only and two inputs on one control converge with one /n_set
per gesture). The inputs bind via `bind:value` like
everything else — internal/sc-input derives the single WRITABLE target from
the resolved runtime prop (plain path, one target, no expression; an
expression bind is a read-only meter), the widget sync rides the
`runtimeValueChanged` hook (no extra subscription); sc-synth uses the explicit
non-state `synthdef` reference. A numeric path TAIL is an array-SLOT LENS
(`bind:value="env.5"`): the read half evaluates that element live, the
write half (ScInput.commit) replaces the slot in a fresh copy of the whole
array — one statechange, every other lens/editor resyncs. Bare-name state
binds resolve on the parent node first, then fall back LEXICALLY through
the enclosing scopes (a synth's instance control can derive from a
plugin-level var). Expression FUNCTION CALLS (lib/expression/functions):
SC envelope constructors (`adsr`/`perc`/`linen`/… from the compiler's
env-registry) + `pad()` work in static `value` attributes (strict, loud,
memoized), in runtime binds (NaN-guarded), and in synthdef GRAPHS — where
param REFS pass into the modulatable envelope slots (a live server-side
ADSR retunable via /n_set) and calls on non-variadic inputs are rejected. The
statechange dispatch is gated on `isStateRuntime` — only named state is
targetable, so consumers stay silent. The READ-ONLY visuals (sc-display's
`value`, sc-if's `when`) read through the same machinery; evaluated values
that miss their spec type warn once per element+prop (non-numeric on a
numeric prop falls back to the widget default). Native inputs bind with Lit's `live()` (the user mutates the DOM
directly); everything unsubscribes in `disconnectedCallback`.
Unmount drops the plugin's store map. Store-key uniqueness is enforced
structurally by TRANSPARENCY: nameless non-node sc elements (sc-if,
sc-select, sc-radio-group — `isTransparent`, internal/engine/resolution.ts) open
NO sibling scope and NO path segment — the parse walks through them
(`walkScElements`), so their contents parse into the ENCLOSING level,
share its duplicate-name check (a same-named var inside an sc-if fails
flat, `bad-if-shadow`), its bind scope, and its store paths. Attachment
walks through transparency too: `_parentScNode` IS the
nearest non-transparent ancestor (the level owner) — the owner every consumer needs
(ScControl's /n_set, name lookups over `_scChildren`) — and transparent
containers stay runtime-tree leaves (sc-select reads its option children
from the DOM). sc-if contents are therefore UNCONDITIONALLY
live — hiding is visual-only. The var must-be-on-a-node rule survives as a
defensive guard for genuinely non-node levels (inside a synthdef). Names
are syntax-validated as ONE bind-path segment (the spec `name` type — letters,
digits, `_`, `-`; no dots): a dotted name would forge another scope's store
key (`bad-name-syntax`; the
shared Rust gate enforces it natively at upload and as wasm at parseEntry).
There is deliberately NO name-based group→descendant control propagation —
a group-level control's /n_set on the group node is the server-side
mechanism (scsynth fans it out), plus explicit `bind:value="group.ctl"`.

Bind-expression fine print (lib/expression): a bare name-shaped bind is
always a PATH, so hyphenated state names like `fm.mod-freq` stay
addressable, while `-` inside real expressions means subtraction; the
comparisons are non-associative and evaluate to 1/0. Examples live in
`examples/plugins/<category>/` (see examples/README.md —
app/synths/bindings/inputs/widgets/invalid).


## The wire, top to bottom

| Hop | Protocol | Contract |
|---|---|---|
| store → component | reactiveStore `select` views | notify only on `Object.is` change |
| element ⇄ OscClient | command methods + `once(address, match)` waiters | replies matched in `handleReply` |
| OscClient ⇄ worker | `postMessage` commands ↓ / events ↑ | inbound buffers transferred zero-copy |
| worker ⇄ Rust | WebSocket **binary frames = raw OSC packets** | bytes are never rewritten by either side |
| WS pump ⇄ peers | UDP datagrams, address-routed by regex | `/scope/*` + `/clock/*` intercepted, never routed |
| backend ⇄ scsynth SHM | mmap, read-only, triple-buffer `_stage` protocol | `/scope/chunk` args + BE f32 blob (golden-tested) |
| HTTP errors | ApiError envelope `{code, message, violations?}` | parsed by HttpError; violations = the tsify-generated shape |

## End-to-end traces

**Outbound command** (e.g. `<sc-plugin>` creating its group):

```
ScPlugin load pass → oscClient.createGroup() → send(gNewOne(...))
  → tx appended to osc.log (sc-console) → worker codec pack
  → postMessage(transfer) → worker ws.send → axum ws pump
  → peek_address("/g_new") → Bridge → regex match "scsynth" peer → UDP
```

**Inbound reply** (e.g. `/n_go`, `/fail`, `/status.reply`):

```
scsynth UDP → Peer recv task → shared broadcast (Bridge fan-out)
  → every WS pump → binary frame → worker (zero-copy) → decode:
      OscClient.handleReply → once-waiters (createSynth's /n_go gate, …)
      middlewares (stores/osc): /status.reply → scsynthStatus (footer)
                                 + watchdog re-arm
      errors middleware: /fail, /late → coalesced toast (stores/toasts)
                                        + rx log (sc-console)
      /scope/chunk → the subscribing <sc-scope>'s handler (by subId)
```

**Scope audio** (bypasses the store entirely): see scope.md — tap synth
(ScopeOut2) → SHM slot → WS pump 5 ms `_stage` peek → `/scope/chunk` →
worker → the element's onChunk → RAF canvas draw. React/Lit render cycles
are not involved per frame.

**Plugin install → render**:

```
zip → POST /api/plugins (or `sc-app2 plugin add`) → manager validation
  (metadata rules → sc-validate spec gate → asset image sniffing)
  → stored zip + registry → refreshPlugins → plugins slice → picker
  → box assigned → PluginHost fetches the entry → parseEntry (wasm gate +
    text/xml parse + importNode + upgrade, disconnected)
  → processRoot() (identity, scopes, binds) → mount → the load pass
    (/d_recv … /s_new in DOM order)
```

**Heartbeat & failure**: supervisor `/status` at 1 Hz → `/status.reply`
fan-out → footer + frontend watchdog (5 s). scsynth dies → watchdog fires →
toast + `oscClient.close()` → WS close → server `end_session` → status
`"error"` → ConnectionOverlay's Retry revalidates the route loaders (a dead
session revives-or-mints).

## Ownership & lifetime invariants

| Thing | Lives exactly as long as | Owner |
|---|---|---|
| WS worker | the page (respawned on crash) | `WorkerClient` |
| WebSocket connection | one session | `OscClient` (closes itself on critical failures) |
| Session (group + node-id block) | its WebSocket | Rust `Server` (ends on socket close) |
| Session **identity** + data (boxes + presets) | until overwritten | localStorage + `<root>/sessions/<id>.json` |
| Scope tap synth + subscription | the element's load/unload pass | each `<sc-scope>` |
| OSC log | the page (survives reconnects) | logging middleware (`osc` slice, bounded 300) |
| Toasts | until dismissed/auto-expire (coalesced by key) | `stores/toasts` (any producer) |
| Plugin zips + registry | until removed | `plugin::manager` (HTTP + CLI share it) |
| scsynth client slot | the server process (`/notify 0` on shutdown) | `Scsynth` supervisor |

## Accepted quirks (documented so nobody re-discovers them)

- Evaluated `bind:` values get type/enum warnings but NO range checks
  (`bind:gain` going non-positive degrades silently).
- happy-dom's XML parser drops the later of two attributes whose LOCAL
  names collide (`value` + `bind:value`) — irrelevant to the gate since the
  Rust validator (roxmltree) sees both.
- `getProp` is untyped by design (`as number` casts at call sites).
- Static-value widgets show their Lit default until their sequential load
  turn seeds them.
- Diamond bind dependencies can transiently double-dispatch before
  converging (Object.is-guarded per hop).
- sc-display renders arrays as comma-lists; MCE arrays are flat.
- The envelope editor's time axis re-zooms on release when a drag extended
  the total duration (shape-preserving).
- Synthdef names are global to scsynth — two plugins declaring the same
  name overwrite each other.
- Envelope latch semantics (by design): a keyboard voice latches its
  `bind:envelope` value INTO its own `/s_new` — new voices always sound the
  current shape; playing voices keep the shape they were born with.
- The CLI and a running server both rewrite plugins.json unlocked (dev-only
  race).
