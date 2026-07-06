# sc-app2

A desktop/browser app for controlling SuperCollider (scsynth) and Strudel through a
Rust OSC bridge. Built with Tauri 2 (Rust backend) + React 19 + Lit 3 web components.
It is the ground-up successor of the old `sc-app` project (checked out as the
`sc-app/` submodule), whose features are being migrated here — see
**Migration plan** at the bottom.

## Quick reference

```bash
# Frontend dev server (port 1420; /api + /ws proxied to :3000)
yarn dev

# Frontend + headless Rust server together
yarn dev:full

# Full native app (embedded server + webview)
yarn tauri dev

# Headless HTTP server only (browser mode, port 3000 from config.json)
yarn serve

# scsynth + sclang/StrudelDirt for local dev (pre-req: yarn deps, once)
yarn osc

# Type-check + bundle the frontend
yarn build

# Unit tests (the example plugins through the parse engine, happy-dom)
yarn test

# Rust check / unit tests
cd src-tauri && cargo check && cargo test
```

## Architecture

### Run modes

* **Native GUI** (`yarn tauri dev` / no CLI subcommand): the Rust side boots the
  embedded HTTP server first, then builds the window programmatically with an
  initialization script injecting `window.HTTP_BASE_URL = "http://127.0.0.1:<port>"`
  (the webview origin is `tauri://localhost`, so same-origin URLs don't work).
  There is **no Tauri IPC** — the webview talks plain HTTP/WS like any browser
  (the API serves permissive CORS: the webview origin — `tauri://localhost`,
  or the Vite devUrl in dev — is always cross-origin to the loopback server).
* **Serve** (`sc-app2 serve`): the same server headless; browsers are same-origin
  (or Vite-proxied in dev) and `HTTP_BASE_URL` is `""`.

### Frontend (`src/`)

```
main.tsx                 boot: register sc-* elements, session.start(), render <App/>
components/              React shell: Dashboard grid, plugin picker/list, toasts,
                         the connection overlay (boot loader + retry modal over
                         the session status), ui/ (Modal — the first of the
                         planned components/ui primitives)
sc-elements/             Lit elements used inside plugin HTML, classified by the
                         old app's taxonomy (see sc-elements/README.md for the
                         per-element docs): nodes/ (plugin/group/synth),
                         synthdef/ (synthdef/ugen), state/ (control/var),
                         inputs/ (range/checkbox/select/option/radio-group/
                         radio/run), visuals/ (display/if), widgets/ (strudel/
                         scope/console). index.ts is the barrel +
                         registerScElements(). internal/ is ALSO the runtime:
                         the element IS the runtime — no item structures. The
                         ScElement base carries the parse engine (hydrate/
                         process/processChildren) + the common runtime fields;
                         validation.ts holds the validation + bind-resolution
                         helpers as plain functions; the category bases
                         (sc-node/sc-state/sc-input, the old app's names)
                         declare the category props + runtime values; each
                         component overrides resolveRuntime(), whose result
                         process() assigns onto the element itself
runtime/                 the global parsed-element registry (id → the live
                         ScElement component), deliberately NOT a store slice
stores/                  the single app store + slices and React hooks
  store.ts               createStore({ session, osc, layout, plugins, runtime })
                         — the ONLY store. Cross-module shapes come from @/types
                         (type-only by construction), so no runtime cycle with
                         the singletons.
  runtime.ts             LITERAL runtime values per mounted plugin:
                         plugin-root-id → state path ("s1.freq", "vars.a") →
                         number. Only literal, user-writable state is
                         store-backed (derived/bound values live on the
                         elements as `_state` and propagate via
                         "statechange"); seeded from the declarative defaults
                         in the load pass; dropped wholesale on unmount;
                         ScState.setValue is the only OSC-dispatching writer
                         (controls add the /n_set)
  layout.ts / plugins.ts / session.ts / osc.ts / useStore.ts
types/                   .d.ts domain shapes (old sc-app convention):
                         stores.d.ts (app state), api.d.ts (HTTP payloads),
                         osc.d.ts (transport), sc-elements.d.ts (JSX tags),
                         runtime.d.ts (engine types: runtime mixins + RuntimeContext)
constants/               per-domain constants (as-const maps + defaults):
                         env (HTTP_BASE_URL), osc (OSC_REPLIES, scope tap),
                         session, layout (grid), sc-elements (ELEMENTS), store (SliceName)
lib/                     non-React infrastructure
  http/                  get/post/put/patch/del prefixed with HTTP_BASE_URL, wsUrl(),
                         HttpError (carries the response body, e.g. plugin validation errors)
  osc/                   the OSC transport (see lib/osc/README.md):
                         OscClient (global `oscClient`, mirrors the osc-js OSC class,
                         owns /g_new of the session group + nextNodeId allocation,
                         AND the osc store slice: tx/rx console log, /fail–/late
                         banners, /status.reply load + heartbeat watchdog, the
                         `connected` signal; closes itself on critical failures;
                         AND the elements' scsynth command methods — every
                         sequenced send + reply wait: createGroup/createSynth
                         (→ /n_go, returning the allocated node id),
                         sendSynthDef (/d_recv + embedded /sync ack),
                         freeGroup/freeSynthDef/freeSynth/setControl,
                         subscribeScope(…, onChunk) → {subId, off} (handler
                         registered under the minted subId before the send;
                         decoded chunks dispatch by subId from handleReply;
                         off also stops the bridge stream) + the scope-slot
                         allocator (allocScopeIndex/freeScopeIndex over the
                         session's server-assigned span))
                         → OscWorkerPlugin (osc-js Plugin impl, a thin
                           adapter over lib/worker's WorkerClient)
  worker/                the worker-backed WebSocket transport:
                         WorkerClient.ts (global `workerClient`: main-thread
                         proxy owning THE permanent worker — respawned if it
                         crashes — + status, WorkerTransport interface — {open,
                         close, send, onEvent, status})
                         → worker.ts (Web Worker entry: protocol ⇄ transport)
                         → transport.ts (createWsTransport: the raw WebSocket,
                           same WorkerTransport interface, in-worker)
  session/SessionManager (global `session`): mints/revives the session over HTTP,
                         connects oscClient and observes its close (→ conn status),
                         10s layout autosave
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
dashboard layout persist** server-side:

1. Boot: `localStorage["sc.session"]` → `GET /api/session/{id}` **revives** the
   saved session under the same UUID (fresh node-id block) and returns the saved
   layout; on any failure fall back to `POST /api/session` (new id, stored back).
   While scsynth is unregistered the server answers 503 (it binds without
   waiting for scsynth, so the GUI window opens regardless) and the
   SessionManager retries quietly under the boot overlay — but only within
   the SCSYNTH_RETRY_LIMIT budget (~5 s), after which the error modal
   advises that no connection is coming (its Retry restarts the budget).
   Any other failure, including a WS drop after connecting, shows the error
   modal immediately.
2. `oscClient.connect(wsUrl, block)` opens the WS (in the worker) and sends
   `/g_new` — the session group lives **at the tail of scsynth's root group 0**;
   synth ids come from `oscClient.nextNodeId()` over the server-assigned block.
3. Every 10 s the SessionManager `PUT`s the layout to `/api/session/{id}` when it
   changed; the server stores it under the app data dir (see below).
4. WS close (reload/quit) → the server ends the session and frees its group.
   Server shutdown frees all live session groups one by one, then `/notify 0`.

### Backend (`src-tauri/src/`)

Two layers: `cli/` (the argv surface, one file per command) over `core/`
(the whole application engine, incl. the axum `router/` transport, composed
by `core::start`); `lib.rs` is just the module tree + `run()`.

```
lib.rs            module tree + pub fn run() → cli::run()
cli/              mod.rs (clap definitions + the single exhaustive dispatch —
                  every command but the GUI reports through exit_cli — and
                  the ONE tauri generate_context! site);
                  serve.rs (ServeArgs + the headless run mode),
                  gui.rs (the Tauri run mode: window + injected base URL),
                  plugin.rs (validate|add|remove|list, over core/plugin's
                  manager), config.rs (write|validate)
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
  sessions.rs     LIVE-session store (Uuid → block, index recycling)
  layouts.rs      SAVED dashboard layouts: sessions.json registry +
                  sessions/<id>.json
  server.rs       the app-logic facade the router holds as axum State:
                  session mint/revive/end, the shared scope SHM handle
  config.rs       config.json (port, peers, connect_timeout, log_dir) +
                  app-data-dir paths
  logger.rs       tracing to stderr + optional rotated JSON file
  plugin/         zip validation (metadata, XSD entry, assets) + plugins.json
                  registry (manager.rs + xsd/)
  scope/          scsynth SHM scope buffers → /scope/chunk frames over the
                  WS, one file per layer: mmap.rs (read-only mapping +
                  acquire reads), layout.rs (scope_buffer layout +
                  discovery), reader.rs (non-mutating slot reader), wire.rs
                  (the /scope/* contract), session.rs (per-slot cursors +
                  SessionScopes — one session's subscriptions, span gating,
                  latest-only chunk staging, owned by the WS task; ws.rs
                  stays pure transport). See scope.md
  router/         axum: session.rs (POST/GET-revive/PUT-layout/DELETE),
                  ws.rs (per-socket OSC pump; /scope/* intercepted; ends the
                  session on close), plugin.rs, diag.rs, assets.rs
```

App data dir (`~/Library/Application Support/com.nicmell.scapp/`): `config.json`,
`plugins/` + `plugins.json`, `sessions/` + `sessions.json`.

### Key constants

* HTTP server: `127.0.0.1:3000` (config.json `port`); Vite dev: `1420`.
* Peers: scsynth `127.0.0.1:57110` (`/[sngbcdpu]_*`, /notify, /status…),
  strudel/SuperDirt `127.0.0.1:57120` (`/dirt`, `/clock`); `/scope/*` is
  bridge-internal (never routed to a peer).
* scsynth must boot with `-maxLogins ≥ 2` (`yarn osc` does) so the bridge's
  clientID ≠ sclang's and node-id blocks don't overlap.
* Scope slots: scsynth boots 128 SHM scope buffers; each session is assigned
  an aligned span of 8 (`SCOPE_SPAN`, core/blocks.rs —
  `scopeIndexBase`/`scopeIndexCount` in the session payload). The frontend
  allocates one slot per `<sc-scope>` (`oscClient.allocScopeIndex`); the
  bridge rejects subscribes outside the session's span. One WS supports any
  number of concurrent scope subscriptions, keyed by subId.

## Workspace packages (`packages/`)

* `@sc-app/server-commands` — scsynth OSC command constructors over osc-js
  (`sNew`, `dRecv`, `gNewOne`, scope subscribe/chunk parsing, encode/decode,
  timetags). The frontend's only OSC vocabulary.
* `@sc-app/synthdef-compiler` — SynthDef → SCgf compilation (used by lib/scope's
  tap def).
* `@sc-app/ui-components` — base styles/custom-element foundation.

## How the element architecture settled (the design decisions)

The architecture evolved through deliberate steps away from the old app's
parser-item design; each decision is load-bearing for the recipe below:

1. **Attributes became reactive properties** on the components (`@property()
   accessor`, lowered by `esbuild.target: "es2022"`), replacing hand-parsed
   attribute copies on parser items — and `validate()` moved next to them.
2. **The items lost their copied props, then their `type` field** (the tag is
   the discriminant), **then their nested `runtime` object** (values merged
   flat), **and finally their existence**: the element IS the runtime.
   `process()` lives on `ScElement` — it attaches the element to its
   parent, validates it, then assigns `resolveRuntime()`'s values onto the
   component itself. `lib/html` and `src/runtime/handlers.ts` are gone —
   the engine lives on the base, and the validation + bind-resolution
   helpers are plain functions in `internal/validation.ts`, taking the
   element explicitly where the error messages need it.
3. **The old app's `internal/` category bases returned** (`sc-node`,
   `sc-state`, `sc-input`) to declare the per-category props + runtime
   fields once; concrete elements are mostly `validate()` + a small
   `resolveRuntime()` override composed via `super`.
4. **Runtime values are live element references, not string ids**:
   `_rootScNode`/`_parentScNode`/`_scChildren` (named so because DOM
   `children` is taken), `_targetScNode` on inputs, `targets:
   Record<path, ScState>` on state. Cycle detection walks the bind graph
   through these references with no lookups; the only id-keyed structure
   left is the global registry (`@/runtime/registry`, id → live element),
   whose purpose IS lookup from outside the DOM — it adopts a parsed tree
   by walking `_scChildren` from the root. Anything *persisted* (presets,
   layout) stays id/path-based; references are in-memory runtime only.
5. **Values that duplicate a reactive prop are unified, never copied**: no
   runtime `name`/`run`. The live VALUE is the exception that settled the
   other way (the ScDerived step): `value` is the plain declarative attribute
   mirror everywhere (the synthdef collection depends on telling a missing
   attribute apart), and the live value is the element's `_state` — fed by
   the store for literal state, by the bind recompute for derived — with the
   "statechange" event as the uniform notification seam.
6. **The parse context is per-level and `process` recurses**: `process(ctx)`
   threads `{rootNode, nodes: Set<ScElement>, scope, parentNode, path}` —
   one shared object per sibling scope; it attaches the element to its
   parent's `_scChildren`, runs `validate()`, then `resolveRuntime()`
   (which recurses via `processChildren` where the element parses
   children). A parent hydrates (assigns ids to) ALL its children into the
   level scope and checks duplicate names BEFORE any child processes, with
   inner-scope shadowing on name lookups.
7. **Bind-order constraint (ENFORCED): bind targets must be declared BEFORE
   their references in DOM order.** Elements that have not yet been
   processed cannot be referenced — `resolveNode` throws `<tag>: "name" is
   referenced before it is declared` when a bind names an in-scope element
   that hasn't processed yet (a name matching nothing keeps the
   does-not-match errors), and `resolveControlBind` gives the same honest
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
   to the self-reference guard in `resolveStateBind` (`target === el`; an
   element can still name itself through its mid-processing parent —
   `bad-circular-bind` pins it).
8. **Two validation gates** keep all of this honest: `yarn test` (the
   examples through the engine in happy-dom, exact error messages pinned)
   and the CDP harness (upload/XSD path + real browser) — see "Validating
   example plugins" below.

## Migrating an sc-element (the recipe)

The element architecture settled as described above — follow this for every
further `sc-*` element:

1. **Tag**: add it to `ELEMENTS` (`src/constants/sc-elements.ts`), the
   constructor `REGISTRY` (`src/sc-elements/index.ts`), and the backend XSD
   (`src-tauri/src/plugin/xsd/sc-plugin-schema.xsd` — declaration, complex
   type, content-model group). The JSX augmentation grows automatically.
2. **Attributes live on the component — the class IS the attribute
   contract.** Declare them as standard-decorator reactive properties —
   `@property({ type: Number }) accessor min = 0;` — there is no parallel
   props interface. (Vite lowers the decorators via
   `esbuild.target: "es2022"`; attribute→property conversion replaces hand
   parsing. Use the shared `runAttribute` converter for `run="false"`
   semantics.)
3. **Validation is colocated**: override `validate()` on the component,
   building on the `internal/validation` helpers, called with the element —
   `requireProp(this, …)`, `requireNumeric(this, …)`,
   `requireNoScChildren(this)`, `failValidation(this, …)`. `process` calls
   it before resolving and a violation fails the whole plugin. This is the
   *real* gate — fastxml does not enforce XSD attribute requirements at
   upload.
4. **Runtime values live ON the element** — there are no item structures.
   Declare them as plain (non-reactive) fields on the component, or inherit
   them from the category base (`internal/sc-node`: nodeId/loaded + run;
   `internal/sc-derived`: bind + targets/expression + the live `_state` +
   "statechange"; `internal/sc-state` extends it: name/value + the store
   backing for literal state + the shared validation; `internal/sc-input`:
   bind + `_targetScNode`); the common core
   (`_rootScNode`/`_parentScNode` — live element references, not ids —
   plus path/enabled and `_scChildren` for parents, named so because DOM
   `children` is taken) is on `ScElement`. The mixin contracts
   (`BaseRuntime`/`NodeRuntime`/`DerivedRuntime`/…) live in
   `src/types/runtime.d.ts` as `resolveRuntime` return types. Values that duplicate a reactive prop are unified
   with it, never copied (no runtime `name`/`run`; `value` stays the plain
   attribute mirror — the LIVE value is `_state` on the ScDerived base, see
   "Runtime values"). There is **no `type` field**: the discriminant is the
   tag (`typeOf(el)`, `lib/utils/guards`), and the guards narrow to the
   component classes via type-only imports.
5. **Runtime resolution**: override `resolveRuntime(ctx)` on the component —
   the parse engine (`process`/`processChildren`/`walkScElements`) is
   inherited from `ScElement` (`internal/sc-element.ts`); the bind machinery
   is imported from `internal/validation` — `resolveStateBind(this, ctx,
   bind)`, `resolveVisualBind(this, ctx, bind)`, `resolveNode(ctx, path)` —
   and the runtime values build over `baseRuntime(ctx)` (or ScNode's
   `this.nodeRuntime(ctx)`); the base `process(ctx)` assigns them onto the
   element. `ctx` is the per-LEVEL state ({rootNode, nodes, scope,
   parentNode, path}) shared by all siblings. The default is the
   self-contained leaf. Extend `lib/utils/guards.ts` if the element joins a
   category (state/node/parent). Add the element's examples to the unit
   suite's expectations (`src/sc-elements/__tests__/examples.test.ts`) if it ships a new
   fixture.
6. The registry (`@/runtime/registry`) maps ids to the live components
   themselves (identity pinned by the unit suite and the dashboard probe),
   so props, runtime values, and methods are reachable from outside the
   DOM.

## Migration state (elements)

| element | status |
|---|---|
| sc-plugin | functional root: loads/parses entry, owns the plugin scsynth group (its `nodeId`), orchestrates the load pass |
| sc-synthdef, sc-ugen | functional: params + ugen specs collected at parse, compiled to SCgf (lib/synthdef) at /d_recv time in the load pass (oscClient.sendSynthDef awaits the embedded /sync ack), freeSynthDef on unmount |
| sc-synth, sc-control | functional: oscClient.createSynth (controls baked in — a BOUND control bakes its computed value — gated on /n_go, plus a post-ack catch-up /n_set for writes landing in the send→/n_go window); setValue → runtime store + setControl (/n_set); bound controls re-/n_set on recompute. `run="false"` not honored yet (sc-run step) |
| sc-range, sc-knob | functional: render the ui-components `<sc-base-slider>`/`<sc-base-knob>` (all base props forwarded), reading the bound control/var through the shared `ScInput` seam (`_state`/`onStateChange` subscription + `syncFromState`) and writing via `commit()` on the widget's composed `input` — a write to bound/derived state is inert and the widget snaps back. sc-knob is the rotary sibling (no `orientation`) |
| sc-checkbox, sc-switch | functional: render the ui-components `<sc-base-checkbox>`/`<sc-base-switch>` over the shared ScInput seam (checked ↔ 1/0); sc-switch is the toggle sibling (no `label`) |
| sc-select, sc-option, sc-radio-group, sc-radio | functional: sc-select/sc-radio-group render the ui-components `<sc-base-select>`/`<sc-base-radio-group>`, projecting each option/radio child's collected `{value,label}` into the base widgets; the shared ScInput seam syncs the selection from `_state` and dispatches the chosen value via `commit()`. sc-option/sc-radio are pure data (consumed at parse, never enabled) |
| sc-display | functional: the read-only expression visual |
| sc-var | functional: live `_state` on the shared ScDerived base (no OSC) — literal vars store-backed like controls, bound vars recompute element-to-element on their targets' statechange |
| sc-if | functional: conditional rendering on the TRUTHINESS of an expression `bind` (`bind="osc.gate"`, `bind="vars.freq > 440"` — the ScDerived base; the old `is-*` attributes are gone); visibility via the `hidden` attribute + sc-if.scss (display: contents / [hidden] none — children stay mounted while hidden); must not contain node elements (visual-only hiding + path transparency) |
| sc-group | **stub**: parsed; no own /g_new yet (children target the plugin group) |
| sc-run | **stub**: parsed + validated + bind-resolved; no UI/logic (needs /n_run — arrives with the node-lifecycle step) |
| sc-console | functional leaf (the OSC console; no attributes) |
| sc-scope | functional + parametrized: tap props `bus`/`channels`/`frames` (the visible window in samples — default 1024, ≤ 16384) + renderer-only display props `trigger` (auto\|normal\|off — edge trigger on lane 0, lib/scope/trigger.ts), `slope`, `level`, `gain`, `layout` (overlay\|split) — see scope.md §5. The element owns its tap (def + synth at the session-group tail + a scope slot from the session's span) through load/unload. NOT the old buffer-bound sc-scope (buffer-family step) |
| sc-strudel | functional + parametrized: text content = initial pattern code, `orbit` stamps un-routed dirt events; editor mounts offline, unload stops playback |
| sc-buffer, sc-waveform, sc-test, old buffer-bound sc-scope | **not migrated** (buffer-family step) |

**The load pass**: after the sync parse, `ScPlugin.firstUpdated` awaits
`load()` — an async walk over `_scChildren` in strict DOM order, each child
fully awaited before the next (no reactive depsReady gates; the bind-order
constraint makes DOM order a valid dependency order, so /d_recv's ack always
precedes the dependent /s_new). The elements never touch `send`/`once`
directly — every sequenced send + its reply wait is an OscClient command
method (createGroup/createSynth/sendSynthDef/…, node ids allocated
internally), built on `oscClient.once(address, match)` (waiters matched in
`handleReply` — also the unit-test seam), registered before the send.
`unload()` walks in reverse on unmount; synth
nodes die with the plugin group's gFreeAll (no per-synth /n_free). Known
old-app-parity limitation: synthdef names are global to scsynth — two plugins
declaring the same name overwrite each other.

**Connection lifecycle**: every mounted plugin lives with the connection —
ScPlugin subscribes to `oscClient.connected` (the ScopeController's pattern).
A drop runs `unload()` (the exact inverse of the load pass: store
subscriptions dropped, flags/node ids reset, teardown sends silently dropped
on the dead socket) while the per-plugin runtime map survives;
reestablishment re-runs the load pass — fresh node ids from the new session
block, and the /s_new carries the user's current values out of the runtime
slice. A `loadEpoch` on the plugin root (bumped by unload/reload) invalidates
any suspended load pass, so a mid-load disconnect can't leak a stale /s_new
into the new connection. Parse failures stay permanent (`parsed` flips only
when `process()` succeeds — reload never retries them).

**Runtime values**: every live value lives on the element as `_state`, on
the ScDerived base (internal/sc-derived.ts — bind → targets/expression,
`updateState()` as the Object.is-guarded single writer, and a non-bubbling
"statechange" CustomEvent with `onStateChange()` as the ONE subscription
seam every reader uses — inputs, visuals, downstream bound state). The
`runtime` store slice (plugin-root-id → full state path "s1.freq"/"vars.a"
→ number) holds ONLY the literal, user-writable keys: ScState seeds the
declarative default in the load pass (a reload keeps user-moved values) and
mirrors the store key into `_state`, so external slice writes (a second
input, future presets — literal keys only) notify dependents through the
same statechange, with no OSC. BOUND state is derived, element-to-element:
`_state` recomputes from the targets' `_state` on their statechange (evalExpr
over the parsed expression; a plain single-path bind is the identity) — NO
store key at all; the bind-order constraint makes the target graph a DAG
resolved in DOM order, so it settles in one pass and terminates (diamond
deps can transiently double-dispatch before converging — accepted). Derived
state is read-only: `setValue()` on it is inert, and the inputs re-read
after writing so they snap back. Writes split as `setValue()` (public,
enabled+unbound only) over `dispatchValue()` (Object.is-vs-store guard +
store write; ScControl's override adds the /n_set — the user-gesture WRITE
path), while a bound control's recompute /n_set lives in the `stateChanged`
hook (guarded on `targets` + the live-node gate, so external store writes
stay UI-only and two inputs on one control converge with one /n_set per
gesture). The WRITING inputs (range/checkbox — internal/sc-input's single
writable `_targetScNode`) and the READ-ONLY expression visuals
(sc-display/sc-if — ScDerived directly) all read `_state` +
`onStateChange`. Native inputs bind with Lit's `live()` (the user mutates
the DOM directly); everything unsubscribes in `disconnectedCallback`.
Unmount drops the plugin's store map. Store-key uniqueness is enforced
structurally: enabled state must be declared ON A NODE (a var off-node —
e.g. inside the path-transparent sc-if — is a parse error,
`bad-var-scope`), and sc-if rejects node descendants (`bad-if-node`; hiding
is visual-only — a "hidden" synth would still play). The old app's id-keyed
store allowed that shadowing, and its name-based group→descendant
SET_CONTROL propagation is deliberately NOT reproduced — explicit
`bind="group.ctl"` is the replacement (revisit at the sc-group step).

Runtime layer: all old handlers ported (bind resolution incl. expressions
via lib/utils/expression parseBind/evalExpr — arithmetic + the
non-associative comparisons `> < >= <= == !=` evaluating to 1/0; a bare
name-shaped bind is always a PATH, so hyphenated state names like
`fm.mod-freq` stay addressable, while `-` inside real expressions means
subtraction) except buffers and presets/overrides. Examples: every old example
without a buffer-family element lives in `examples/<category>/` (see
examples/README.md — app/synths/bindings/inputs/widgets/invalid);
`scope-plugin`, `test-plugin`, `waveform-plugin` stay behind.

**fastxml is pinned to =0.8.0** (src-tauri/Cargo.toml): 0.8.1+ rejects
mixed-content models whose choices have minOccurs="0" (a text-only `<span>`
fails), which the old app never hit because it locked 0.8.0.

## Validating example plugins (the two gates)

**Unit gate (fast, run on every change)**: `yarn test` — vitest + happy-dom.
Each suite lives in a `__tests__/` folder beside the unit under test
(vite.config.ts `test.include` is `src/**/*.test.{ts,tsx}`), with the happy-dom
setup + shared element-suite helpers in `src/lib/utils/test/` (`test-setup.ts`,
`test-utils.ts`: `parsePlugin`/`mountPlugin` mounting, `installScsynthMock`/
`autoRespond` load-pass scripting). Cross-cutting suites sit at their module's
`__tests__/` (`src/sc-elements/__tests__/{examples,controls}.test.ts`,
`src/sc-elements/widgets/__tests__/widgets.test.ts`). Tests AND the test
scaffolding are type-checked by `tsc` (the whole `src` tree is in the build's
tsconfig); `?raw`/`import.meta.glob` resolve through vite/client.
`src/sc-elements/__tests__/examples.test.ts` loads every example entry via `import.meta.glob`,
mounts it into a connected `<sc-plugin>` host (text/xml parse + importNode),
and runs `host.process({rootNode: host, nodes, scope:
[host], path:[]})`. Functional examples must parse clean, and every parsed
synthdef's collected params/specs must compile (a dedicated describe — the
load pass compiles at /d_recv time, so the parse alone wouldn't prove it; the
registry is plain data, happy-dom-safe); the
runtime `bad-*` fixtures must fail with their **exact** message; plus
structural assertions (flat runtime merge, range bind targets, `_element`
identity). The strudel editor stack (browser-only deps that won't import under
happy-dom — @strudel/codemirror, @strudel/transpiler, @strudel/core) is aliased
to inert stubs globally (vite.config.ts `test.alias` → `src/lib/utils/test/
stubs/`); the codemirror stub records constructed editors in `strudelMirrors`
for widgets.test.ts. The five upload fixtures are backend validation and are
excluded here.
`src/sc-elements/__tests__/controls.test.ts` adds the lifecycle gate (load pass
send order, store seeding, /n_set wiring, unmount cleanup — against a scripted
scsynth auto-responder through `handleReply`),
`src/lib/synthdef/__tests__/compileSynthDef.test.ts` the compiler, and
`src/lib/osc/__tests__/OscClient.test.ts` the telemetry + `once()` waiters.

**End-to-end gate (the harness technique)**: when elements/parsers change,
validate every example through the real stack: run
`node scripts/validate-examples.mjs` against `yarn serve` + `yarn dev` +
headless Chrome (`--remote-debugging-port=9222`). What it does:

1. **Upload gate** — zip each `examples/<dir>` and `POST /api/plugins`:
   expect 201, except the upload fixtures `bad-metadata`, `bad-entry-xhtml`,
   `bad-entry-schema`, `bad-asset-type`, `bad-asset-mismatch` → 400 with
   their specific messages.
2. **Runtime gate** — for each installed plugin, over CDP `Runtime.evaluate`
   (with `awaitPromise`): create an `<sc-plugin>` host, **append it to the
   document first** (custom elements only upgrade when connected), fetch the
   entry via `/api/plugins/<id>/<entry>`, parse as **text/xml** (entries use
   self-closing tags; HTML parsing mis-nests them) and `importNode` the body
   children into the host, then
   `host.process({rootNode: host, nodes: new Map(), scope: [host],
   path: []})` — the host's own parse-engine methods; nothing to import.
   PASS = no throw; the runtime `bad-*` fixtures must FAIL, each
   with its intentional resolveRuntime error (one per error path — see the
   `invalid/` table in examples/README.md). Any other failure is a migration
   bug — report it.
3. **Cleanup** — DELETE the plugins the run uploaded, keeping the user's
   registry as it was.

## Migration plan (old `sc-app/` → here)

The old app (see `sc-app/CLAUDE.md` for its full docs) is a declarative
SuperCollider control surface: plugin zips of XSD-validated XHTML built from
`sc-*` elements, parsed into a typed element tree, bound to live scsynth node
graphs, with in-browser SynthDef compilation. The directory layout here was
already reshaped to mirror it (`lib/*` infrastructure, `@/` alias). Migration
steps, each independently shippable:

1. **UI foundation** — ThemeProvider, `components/ui/` (Button/IconButton/Modal),
   SettingsDrawer + an `options` store slice (theme first).
2. **`lib/ugen` + `assets/ugens` + `lib/synthdef`** — DONE, reconciled with
   `@sc-app/synthdef-compiler`: the package provides registry/operators/
   encoder/validation; `lib/synthdef/compileSynthDef.ts` is the markup-spec
   translation (no SynthDefManager — params + specs live on the element,
   compiled at /d_recv time).
3. **`types/` + `constants/` + `lib/utils`** — parser types, guards, the bind
   expression parser.
4. **`lib/html` + `lib/runtime`** — element-tree hydration (cumulative scopes)
   and runtime processing (bind resolution, expressions, overrides). Grow the
   current innerHTML plugin loading into the two-phase pipeline; the Rust XSD
   validation stays as-is.
5. **Core `sc-elements`** — DONE for the synth path AND the state layer:
   `OscClient.once(address, match)` reply matching (waiters in
   `handleReply`) + the scsynth command methods (the elements' whole OSC
   vocabulary), the sequential `load()`/`unload()` pass, sc-synthdef
   (sendSynthDef: compile + /d_recv + /sync ack; freeSynthDef), sc-synth
   (createSynth gated on /n_go into `targetGroupId` + the ack-window
   catch-up /n_set diff), the ScDerived `_state`/"statechange" propagation
   (see "Runtime values"), expression binds with comparisons, sc-if.
   **Next: the node-lifecycle step** — sc-group's own /g_new//g_freeAll
   (descendants nest via `targetGroupId` automatically once the group sets
   `loaded`), `OscClient.setNodeRun` (`nRunOne` sits unused in
   @sc-app/server-commands), `run="false"` honored after /n_go for
   synths/groups (the old app's exact create-then-/n_run sequence), and
   sc-run (play/pause over the target node element; bindless targets the
   parent — a bindless sc-run should require its parent to be a node).
6. **Input elements** — DONE. Value dispatch over the ScDerived seam (see
   "Runtime values"), incl. dispatch to vars and sc-if. The shared `ScInput`
   seam carries the target `_state` subscription over the load/unload/
   disconnect lifecycle + `syncFromState` + the `commit()` snap-back writer,
   and every input renders its ui-components `sc-base-*` widget: sc-range/
   sc-knob → `<sc-base-slider>`/`<sc-base-knob>`, sc-checkbox/sc-switch →
   `<sc-base-checkbox>`/`<sc-base-switch>` (checked ↔ 1/0), sc-select/
   sc-radio-group → `<sc-base-select>`/`<sc-base-radio-group>` (each option/
   radio child's `{value,label}` collected at parse and projected into the
   base widgets — the pattern sc-strudel uses for chips/buttons; knob and
   switch are distinct elements, not a `type`). All base props are forwarded.
   Testing seam (src/sc-elements/__tests__/controls.test.ts): spy
   `oscClient.send` with an auto-responder through `handleReply`; interaction
   tests drive the widgets' composed `input`/`change` in happy-dom (the
   `-base` widgets register via test-setup). Only sc-run is left (its /n_run
   belongs to the node-lifecycle step).
7. **Buffers & scopes — RE-SCOPED around the SHM transport** (the old
   /b_getn + global-clock machinery existed only because the old app had no
   SHM path; the new bus-based sc-scope already covers old sc-test and the
   old buffer-bound scope): port `sc-buffer` as a thin alloc/free element
   (/b_alloc gated on /done, /b_free on unload; bufnum binding into synth
   controls; bufnums as a server-assigned per-session span like the scope
   slots in core/blocks.rs — NOT the old client-side (clientID+1)*100
   counter) and `sc-waveform` as a client-side recorder (record/pan/zoom
   over a growing Float32Array) fed by an SHM scope-tap subscription instead
   of /b_getn. `sc-test` is NOT ported (superseded by sc-scope's `bus`);
   the /b_getn reader + buffer WS + clock.rs stack is the fallback only if
   reading actual buffer CONTENTS (vs the live signal) becomes necessary.
   NOTE: the old sc-app CLAUDE.md's sc-test description (per-synth
   Phasor+SendTrig) is stale — its code uses a shared global-clock synth.
8. **Persistence & presets** — extend the saved-session layout payload with
   the old per-box `OverrideEntry[]` presets (replaces the old
   zustand-persist), marshalled as sparse diffs from the runtime slice —
   LITERAL keys only (derived values live on the elements and recompute; a
   preset writing a bound key would create an orphan store entry nothing
   reads).
9. **Shell polish** — settings (grid size, latency), logger; a ConnectScreen is
   likely unnecessary (sessions auto-connect).
10. **Examples & validation fixtures** — port `examples/` plugin zips (incl. the
    `bad-*` bundles) + packaging script; they are the acceptance tests for 4–7.
