# Multi-tab sessions — design

Status: milestones 1–2 are IMPLEMENTED (the SharedWorker transport —
`src/lib/osc/worker/sessions.ts` — and the box route + iframe dashboard —
`src/routes/BoxPage.tsx`, `/:sessionId/box/:boxId`), with phase-one
exclusive box ownership. Still open: mirrors (milestone 3), wasm-module
transfer, focus routing, and frame-aware e2e probing (milestone 4). The
server keeps its one-socket-per-session 409 as the invariant guard; the
shared worker simply never trips it. Read `docs/architecture.md` for the
current-architecture reference — this document keeps the design rationale
and the deferred roadmap.

## Goal

Several browsing contexts — dashboard boxes, extra browser tabs, popped-out
windows — work on the SAME session: same live synths, cooperative state (a
knob moved anywhere is seen and heard everywhere), one consistent saved
session.

## The two load-bearing ideas

**1. A SharedWorker owns the single WebSocket.** The server's
one-socket-per-session invariant is never violated — no multi-attach, no
relay protocol, no change to the 409 semantics. The backend stays
completely untouched; the session lives as long as the worker holds the
socket and ends normally when the last client is gone.

**2. A box is a first-class, addressable client of the session.** A new
route (`/:sessionId/box/:boxId` as shipped — the literal segment keeps
it unambiguous vs settings/plugins) renders exactly one box's plugin. The dashboard
stops mounting plugins directly and becomes a pure window manager laying
out **iframes** whose `src` is that route. Every browsing context — a
dashboard iframe, the same URL opened as a full tab, a popped-out window —
is the SAME kind of client, talking to the session exclusively through the
SharedWorker (same-origin iframes connect to the same SharedWorker
instance).

Together they collapse "multi-tab support" and "how the dashboard renders
plugins" into one architecture: a tab is just a box client hosted
elsewhere.

## What blocked it (pre-implementation state)

- The server enforces **one WebSocket per session**; the second attach is
  rejected so it cannot free the group under the first tab.
- Everything per-connection lives **per tab**: the WS + codec worker, the
  node-id allocator, session-group ownership, the scope-slot allocator, the
  session-data autosave, and the app-store slices (`SessionManager`,
  `OscClient`).
- Plugins mount into the dashboard's own document: no fault isolation, one
  shared customElements realm, no per-box addressing.

## Architecture

### 1. Promote the existing dedicated worker

The transport is already worker-shaped: `OscClient` → `WorkerClient` →
dedicated worker (codec + raw WS, postMessage protocol). Step one is moving
exactly that worker into a `SharedWorker`:

- One instance owns the socket, the codec, the heartbeat watchdog, and the
  clock estimator, keyed by session id.
- N `MessagePort`s, one per client (the dashboard, each box iframe, popped
  tabs). Inbound OSC fans out to every port; sends funnel in.
- Each client's `OscClient` becomes a thin multiplexer over its port — the
  public seams (`send`, waiters, `connected`, `subscribeClock`) keep their
  signatures. The FIRST client to connect a session id opens the WS; later
  clients JOIN the standing connection and receive its current state.

### 2. Centralize the allocators

Node ids and scope slots must never collide across clients. To keep the
hot paths synchronous, the worker hands each client a CHUNK of the
session's server-assigned spans at join time (sub-ranges of the node-id
block / scope span); clients allocate locally within their chunk and RPC
for another chunk when exhausted. The session group is `/g_new`ed once, by
whichever client's join triggered the WS open.

### 3. Client liveness via Web Locks

`MessagePort` has no close event. Each client acquires a `navigator.locks`
lock named after its port; the worker requests the same lock and is granted
it exactly when the client dies (crash included). Last client gone → grace
timer (so a reload survives) → the worker closes the WS → the server ends
the session normally.

### 4. The box route and the iframe dashboard

- `/:sessionId/box/:boxId` — a slim box shell: resolves the session, joins the
  shared connection, mounts ONE plugin host with that box identity. (The
  existing `/:sessionId/plugins/:pluginId` stays the per-PLUGIN preview;
  the new route is its per-INSTANCE sibling.)
- The dashboard's panels become `<iframe src="/:sessionId/box/:boxId">`. The
  dashboard keeps owning the grid (layout slice, add/remove/assign) and the
  session-data autosave.

What the iframe design buys:

- **Pop-out boxes**: `window.open` the same URL onto a second monitor; the
  dashboard shows a "popped out" placeholder while another client holds the
  box. The killer live-performance feature, for free.
- **Per-box fault isolation + reload**: a wedged plugin is confined to its
  frame and recoverable with a frame reload, without touching the session.
  Plus DOM/CSS isolation and a fresh customElements realm per box.
- **Deep links**: a specific instrument in a session is bookmarkable.
- **Transport-agnostic clients** — the deepest win: every box speaks only
  "port protocol to the worker". Swapping that port for a server socket
  later yields the cross-device fan-out alternative with the SAME client
  contract; the two roads converge instead of competing.
- **The default cooperative case becomes trivially safe**: within one
  dashboard every box has exactly one iframe, so the double-load problem
  cannot occur there.

### 5. State sync — the vocabulary already exists

The content-hash element ids (`engine/contentHash.ts`) are the message
vocabulary: a value change is `{boxId, elementId, value}`, self-validating
on every client (unknown id → drop — the same fail-closed skew behavior as
the persisted presets). Because every iframe is its own realm with its own
app store, shared state must be worker-authoritative:

- The worker holds the session's PRESETS map (seeded from the first
  client's loader data); box clients push their harvests and pull their
  box's entry at mount. The dashboard mirrors the worker's map into its
  presets slice for the existing autosave.
- The LAYOUT stays dashboard-owned (only the dashboard edits the grid);
  the worker relays layout-derived facts clients need (box → plugin
  assignment).
- The `session`/`osc` telemetry slices stay per client.

### 6. Box ownership (the deferred hard part)

Two clients of the SAME boxId (box popped out while still in the
dashboard, or two full dashboard tabs) must not both run the load pass —
double synths. The worker keeps a boxId → client registry:

- **Phase one (ship first): exclusive boxes.** The second client of a
  boxId gets a "box open elsewhere" state instead of loading — the old 409
  semantics, moved from session-granularity to box-granularity. The
  dashboard placeholder for a popped-out box is this state.
- **Phase two: mirrors.** Additional clients mount mirror hosts — same
  parse, same store values (synced by element id), a load pass that skips
  node creation, control writes going out on the shared socket against the
  owner's synced (elementId → nodeId) map. Owner death → the worker
  reassigns and the new owner re-runs the load pass (semantically a
  reconnect: the store survives, synths are recreated).
- Ruled out: moving the load pass into the worker — the load pass is
  DOM-driven (the element IS the runtime); worker-owned nodes would
  reintroduce the parallel item structures the architecture rejects.

### 7. Costs to design around

- **N iframes = N app boots**: each frame runs router + wasm validator +
  store init. Needs a slim box-shell entry; later, the worker can compile
  the wasm ONCE and postMessage the `WebAssembly.Module` to every port
  instead of each frame instantiating from bytes.
- **SharedWorker becomes a hard dependency** of the iframe dashboard.
  Fallback: no SharedWorker → today's direct-mount, single-owner dashboard
  (keep the legacy path behind a feature detect; WKWebView has SharedWorker
  since Safari 16, and the single-window Tauri app can use either path).
- **Keyboard/focus across frames**: sc-keyboard capture and global
  shortcuts don't cross iframe boundaries — needs explicit focus routing
  (worker-relayed key events or focus-follows-pointer). The fiddliest UX
  cost.
- **e2e**: CDP probes must reach into frames; the framework needs a
  frame-aware evaluate.

## Milestones

1. **Shared socket** — SharedWorker transport, chunked allocators,
   Web-Locks liveness. Kills the 409 at the transport level; backend
   untouched.
2. **Box route + iframe dashboard** — `/:sessionId/:boxId`, panels become
   iframes, worker-held presets, exclusive-box registry (phase-one
   ownership). Pop-out and per-box reload land here.
3. **Mirrors** — phase-two ownership: the same box live in several clients
   at once.
4. **Optimizations** — wasm module transfer, lazy offscreen frames, focus
   routing polish.

## Honest alternative: server-side fan-out

Allow multi-attach and let the SERVER relay state frames between a
session's sockets, with per-tab node-id sub-blocks carved from the same
session block. More backend work and a new wire contract, but zero
SharedWorker availability concerns, and it generalizes past one browser —
two *machines* on one session. The iframe design keeps this road open: the
client contract (a box client speaking a port protocol) is exactly what a
remote client would speak over a socket. Decision rule: if cross-device
jamming becomes a real goal, build the relay and reuse the client shape —
don't build both transports speculatively.
