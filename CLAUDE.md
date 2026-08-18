# sc-app2

A desktop/browser app for controlling SuperCollider (scsynth) and Strudel through a
Rust OSC bridge. Built with Tauri 2 (Rust backend) + React 19 + Lit 3 web components.
It is the ground-up successor of the old `sc-app` project (checked out as the
`sc-app/` submodule), whose features are being migrated here — see
**Migration plan** at the bottom.

**Pre-release policy: nothing is deployed.** Breaking changes to any signature
or format (markup syntax, bind grammar, OSC contracts, HTTP payloads) need NO
deprecation errors, migration hints, or compat shims — change it outright and
sweep every usage in the repo (examples, tests, docs) in the same commit.

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
routes/                  the react-router DATA-MODE tree (router.tsx):
                         "/" (rootLoader: stored-or-minted id, replace-redirect)
                         → "/:sessionId" (sessionLoader → SessionLayout, which
                         owns connect()/disconnect() on the loader's
                         SessionInfo and hosts ToastStack/ConnectionOverlay)
                         → DashboardRoute (dashboard + <Outlet/>; the settings
                         child SettingsRoute at /:sessionId/settings renders
                         the drawer, open only once the session is connected —
                         never over the connecting scrim / error modal)
                         and PluginPage (/:sessionId/plugins/:pluginId — a
                         full-screen STANDALONE <sc-plugin> instance with its
                         own runtime map + scsynth group);
                         SessionBootError is the loader-failure modal (Retry =
                         same-path replace navigation, re-runs loaders)
components/              React shell: Dashboard grid, shared PluginHost (offline
                         fetch/parse/process/mount), plugin picker/list, toasts,
                         the connection overlay (connecting scrim + retry modal
                         over the session status; Retry revalidates the route
                         loaders in place), ui/ (Modal — the first of the
                         planned components/ui primitives)
sc-elements/             Lit elements used inside plugin HTML, classified by the
                         old app's taxonomy (see sc-elements/README.md for the
                         per-element docs): nodes/ (plugin/group/synth),
                         synthdef/ (synthdef/ugen), state/ (control/var),
                         inputs/ (slider/knob/checkbox/switch/select/option/
                         radio-group/radio/button/envelope), visuals/
                         (display/if/text/flex/row/col), widgets/ (strudel/
                         scope/console/keyboard). index.ts is the barrel +
                         registerScElements(). internal/ is ALSO the runtime:
                         the element IS the runtime — no item structures. The
                         ScElement base carries the parse engine (process/
                         processChildren) + the common runtime fields;
                         validation.ts holds the parse-time validation/static-
                         coercion + bind-resolution helpers as plain functions;
                         the category bases
                         (sc-node/sc-state/sc-input, the old app's names)
                         declare the category props + runtime values; each
                         component overrides resolveRuntime(), whose result
                         process() assigns onto the element itself
stores/                  the single app store + slices and React hooks
  store.ts               createStore({ session, osc, layout, plugins })
                         — the ONLY app-level store. Cross-module shapes come
                         from @/types (type-only by construction), so no
                         runtime cycle with the singletons. Plugin runtime
                         state is NOT a slice: each mounted <sc-plugin>
                         instance owns a per-instance createStore (see
                         "Runtime values")
  layout.ts / plugins.ts / session.ts / osc.ts / useStore.ts
types/                   .d.ts domain shapes (old sc-app convention):
                         stores.d.ts (app state), api.d.ts (HTTP payloads),
                         osc.d.ts (transport), sc-elements.d.ts (JSX tags),
                         runtime.d.ts (engine types: runtime mixins + RuntimeContext)
  constants/               per-domain constants (as-const maps + defaults):
                         env (HTTP_BASE_URL), osc (timeouts/limits, scope tap),
                         session, layout (grid), sc-elements (ELEMENTS), store (SliceName)
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
  http/                  get/post/put/patch/del prefixed with HTTP_BASE_URL, wsUrl(),
                         HttpError (carries the response body, e.g. plugin validation errors)
  osc/                   the OSC endpoint (see lib/osc/README.md):
                         OscClient (global `oscClient`, plain-packet main-thread client,
                         owns /g_new of the session group + nextNodeId allocation,
                         the `connected` signal, and closes itself on critical
                         transport failures; middleware.ts and middlewares/
                         observe WorkerClient commands/events to own the osc
                         store slice (tx/rx console log, /fail–/late banners,
                         /status.reply load, clock status), while watchdog.ts
                         owns heartbeat expiry and exposes its status observer;
                         AND the elements' scsynth command methods — every
                         sequenced send + reply wait: createGroup/createSynth
                         (→ /n_go, returning the allocated node id),
                         sendSynthDef (/d_recv + embedded /sync ack),
                         freeGroup/freeSynthDef/freeSynth/setControl,
                         subscribeClock(intervalMs, cb) + bridge-synced clockNow()
                         (worker absolute-phase ticks; subscriptions survive
                         reconnect/respawn — see CLOCK.md),
                         subscribeScope(…, onChunk) → {subId, off} (handler
                         registered under the minted subId before the send;
                         decoded chunks dispatch by subId from handleReply;
                         off also stops the bridge stream) + the scope-slot
                         allocator (allocScopeIndex/freeScopeIndex over the
                         session's server-assigned span))
                         → worker/WorkerClient.ts (global `workerClient`: the
                           permanent-worker proxy, respawn-on-crash + status)
                         → worker/worker.ts (Web Worker OSC endpoint: plain
                           `{type:"osc", packet}` protocol ⇄ codec ⇄ bytes;
                           `/clock/*` estimator + absolute-phase scheduler)
                         → worker/transport.ts (raw in-worker WebSocket). The
                           binary codec dependency is worker-only.
  session/               SessionManager (global `session`): the LIVE-connection
                         half — connect(info)/disconnect() (epoch-guarded, with
                         a one-tick deferred disconnect so a StrictMode remount
                         with the same loader info keeps the standing WS),
                         observes oscClient's close (→ conn status), 10s layout
                         autosave on worker clock ticks; resolveSession.ts: the route loaders —
                         mint/revive over HTTP, localStorage ownership, the
                         bounded 503 quiet-retry, the mint→redirect handoff
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

The URL is the session's source of truth (`/:sessionId`); the route loaders
(`lib/session/resolveSession.ts`) own resolution and every localStorage write:

1. Resolution: `"/"` replace-redirects to the stored `localStorage["sc.session"]`
   id (or mints one via `POST /api/session` when nothing is stored); the
   `/:sessionId` loader `GET`s that id — **reviving** the saved session under
   the same UUID (fresh node-id block, saved layout) — and a dead/unknown id
   mints a fresh session and replace-redirects again (the minted info rides a
   module-level handoff to the redirect target's loader, no re-GET). While
   scsynth is unregistered the server answers 503 (it binds without waiting
   for scsynth, so the GUI window opens regardless) and the loaders retry
   quietly under the connecting fallback within the SCSYNTH_RETRY_LIMIT
   budget (~5 s); exhaustion throws into SessionBootError, whose Retry is a
   same-path replace navigation (re-runs the loaders, fresh budget).
2. Connection: SessionLayout's effect hands the loader's SessionInfo to
   `session.connect(info)` → `oscClient.connect(wsUrl, block)` opens the WS
   (in the worker) and sends `/g_new` — the session group lives **at the tail
   of scsynth's root group 0**; synth ids come from `oscClient.nextNodeId()`
   over the server-assigned block. A WS drop after connecting flips the status
   slice to "error"; the ConnectionOverlay's Retry revalidates the loaders in
   place (new info object → reconnect; a dead session revives-or-mints).
   Child navigation (dashboard ↔ settings ↔ plugin page) never re-runs the
   session loader, so it never reconnects.
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
   `children` is taken), `targetScState` on inputs, and each runtime prop's
   `targets: Record<path, ScState>`. Cycle detection walks the bind graph
   through these references with no lookups; there is NO id-keyed lookup
   structure at all — access from outside the DOM goes through the mounted
   `<sc-plugin>` hosts (each parsed tree hangs off its root via
   `_scChildren`; name paths resolve with `walkPath`). Anything _persisted_
   (presets, layout) stays name-path-based; references are in-memory
   runtime only.
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
   impossible — not namespace-well-formed XML, not an XSD NCName; a
   DECLARED prefix is). Upload-gate honesty: fastxml 0.8.0 validates NO
   attributes (`validate_attributes` is a stub) — the schema's attribute
   rules bite only under libxml2 in dev; `validateProps` at parse is the
   authoritative gate, so a wrong plugin usually uploads 201 and dies with
   a pointed error in the plugin box.
6. **The parse context is per-level and `process` recurses**: `process(ctx)`
   threads `{rootNode, nodes: Set<ScElement>, scope, parentNode, path, ordinal}` —
   one shared object per sibling scope; it attaches the element to its
   parent's `_scChildren`, runs `validate()`, then `resolveRuntime()`
   (which recurses via `processChildren` where the element parses
   children). A parent collects ALL its children into the level scope and
   checks duplicate names BEFORE any child processes (each child mints its
   deterministic path-chained hash id as it processes), with inner-scope
   shadowing on name lookups.
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

1. **Tag**: add it to `ELEMENTS` (`src/constants/sc-elements.ts`) and the
   constructor `REGISTRY` (`src/sc-elements/index.ts`). The JSX augmentation
   grows automatically; the backend XSD is GENERATED (next step) — never
   hand-edited.
2. **Attributes live in the colocated spec — the spec IS the attribute
   contract.** Ship a `<tag>.spec.ts` exporting a pure-JSON `ElementSpec`
   (`internal/xsd/types.ts`: attrs typed
   `string|name|decimal|integer|boolean|scalar|enum`, `required`,
   `runtime: false` to opt attrs out of `bind:` bindability; category;
   content model),
   auto-globbed into the runtime `SPECS` registry. Run `yarn generate:xsd`
   (the snapshot test fails otherwise). Components read attributes on
   demand via `getProp(name)` (spec-coerced, untyped — cast at the call
   site; with the `bind:` form present it returns the LIVE evaluated
   value); a declared `default` is applied by `getProp` (with the same
   coercion as a static value) when neither form supplies a value, while
   undeclared defaults stay `undefined` so forwarded props defer to the base
   widget's own default; only
   genuinely-reactive fields (a widget's `value`/`_checked`) stay as Lit
   properties.
3. **Validation is layered**: `validateProps()` (the plain parse-time
   function in `internal/validation.ts`, spec-driven) enforces
   required/numeric/enum plus numeric range facets
   (`min`/`max`/`exclusiveMin`), the `name` type's identifier grammar, the
   no-sc-children rule for choice-less content models, and the runtime-prop
   rules (static-XOR-`bind:` mutual exclusion, required-by-either-form, no
   stray `bind:` attrs, foreign-prefix rejection); overrides of `validate()`
   are only for genuinely cross-attribute/semantic rules. `process` calls
   both before resolving and a violation fails the whole plugin. This is the
   _real_ gate — fastxml does not enforce XSD attribute requirements at
   upload.
4. **Runtime values live ON the element** — there are no item structures.
   Declare them as plain (non-reactive) fields on the component, or inherit
   them from the category base (`internal/sc-node`: nodeId/loaded;
   `internal/sc-state`: `_state` (the `value` runtime slot) + the store
   backing for literal state; `internal/sc-input`: `targetScState` + the
   syncFromState/commit seam); the common core
   (`_rootScNode`/`_parentScNode` — live element references, not ids —
   plus path/enabled, `_scChildren` for parents, and the runtime-prop
   machinery: `runtimeProps`, `getProp`/`runtimeValue`,
   `updateRuntimeValue` → `runtimeValueChanged` hook → "statechange",
   `onStateChange`, the load-prefix subscription wiring) is on `ScElement`.
   The mixin contracts (`BaseRuntime`/`NodeRuntime`/`RuntimeProp`/…) live in
   `src/types/runtime.d.ts`. Values that duplicate a declarative prop are
   unified with it, never copied (no runtime `name`/`run`; `value` stays the
   plain attribute mirror — the LIVE value is `_state`, see "Runtime
   values"). There is **no `type` field**: the discriminant is the tag
   (`typeOf(el)`, `lib/utils/guards`), and the guards narrow to the
   component classes via type-only imports.
5. **Runtime resolution**: the parse engine
   (`process`/`processChildren`/`walkScElements`) is inherited from
   `ScElement` (`internal/sc-element.ts`). Generic `bind:attr` expressions
   need no component code: the base resolves them through
   `resolveRuntimeProps` → `resolveStateBind` from the element spec. Override
   `resolveRuntime(ctx)` only when an element has additional structural
   runtime data (for example node ownership or synthdef references), building
   over `baseRuntime(ctx)` or ScNode's `this.nodeRuntime(ctx)`. The base
   `process(ctx)` assigns that result onto the element. `ctx` is
   the per-LEVEL state ({rootNode, nodes, scope, parentNode, path}) shared
   by all siblings. The default is the self-contained leaf. Extend
   `lib/utils/guards.ts` if the element joins a category
   (state/node/parent). Add the element's examples to the unit suite's
   expectations (`src/sc-elements/__tests__/examples.test.ts`) if it ships
   a new fixture.
6. Props, runtime values, and methods are reachable from outside the DOM
   through the mounted `<sc-plugin>` host: the parsed tree hangs off the
   root (`_scChildren`), and named elements resolve by name path
   (`walkPath`, seeing through transparent containers). There is no global
   element registry.

## Migration state (elements)

| element                                                    | status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sc-plugin                                                  | functional authored/runtime root: `title`/`description` live in `metadata.json` / `PluginInfo`; React's shared PluginHost imports, offline-parses, and mounts the authored root; that host owns the plugin scsynth group (its `nodeId`) and orchestrates the load pass                                                                                                                                                                                                                                                                                            |
| sc-synthdef, sc-ugen                                       | functional: params + ugen specs collected at parse, compiled to SCgf (lib/synthdef) at /d_recv time in the load pass (oscClient.sendSynthDef awaits the embedded /sync ack), freeSynthDef on unmount                                                                                                                                                                                                                                                                                                                                                              |
| sc-synth, sc-control                                       | functional: sc-synth's required `synthdef` attribute resolves its definition; oscClient.createSynth bakes controls in (a DERIVED control bakes its computed value), gates on /n_go, and sends a post-ack catch-up /n_set for writes landing in the send→/n_go window; setValue → runtime store + setControl (/n_set); derived (`bind:value`) controls re-/n_set on recompute, coercing at the OSC boundary (strings skip the send with a warning). `run="false"` is not honored yet                                                                               |
| sc-slider, sc-knob                                         | functional: render the ui-components `<sc-base-slider>`/`<sc-base-knob>` (all base props forwarded), bound via `bind:value` on the shared `ScInput` seam — the generic runtime-prop machinery carries the read side (a plain path is WRITABLE via `commit()` on the widget's composed `input`; an EXPRESSION makes a read-only live meter; a static `value` a fixed inert widget); inert writes snap back. sc-knob is the rotary sibling (no `orientation`)                                                                                                       |
| sc-checkbox, sc-switch                                     | functional: render the ui-components `<sc-base-checkbox>`/`<sc-base-switch>` over the shared ScInput `bind:value` seam (checked ↔ 1/0); sc-switch is the toggle sibling (no `label`)                                                                                                                                                                                                                                                                                                                                                                              |
| sc-select, sc-option, sc-radio-group, sc-radio             | functional: sc-select/sc-radio-group render the ui-components `<sc-base-select>`/`<sc-base-radio-group>`, projecting each option/radio child's collected `{value,label}` into the base widgets; the shared ScInput `bind:value` seam syncs the selection and dispatches the chosen value via `commit()`. sc-option/sc-radio are pure data (consumed at parse, never enabled)                                                                                                                                                                                      |
| sc-display                                                 | functional: the read-only value visual — static `value` or dynamic `bind:value` expression (string ternaries included), printf `format` (also runtime-capable)                                                                                                                                                                                                                                                                                                                                                                                                    |
| sc-var                                                     | functional: live `_state` on the ScElement runtime-prop machinery (no OSC) — literal vars store-backed like controls (`value` is a SCALAR: strings allowed), derived vars (`bind:value`) recompute element-to-element on their targets' statechange                                                                                                                                                                                                                                                                                                               |
| sc-if                                                      | functional: conditional rendering on the TRUTHINESS of the `bind:when` expression (`bind:when="osc.gate"`, `bind:when="vars.freq > 440"` — the ScElement runtime-prop machinery); a TRANSPARENT container — its contents parse into the ENCLOSING scope and are UNCONDITIONALLY live (a hidden synth keeps playing; a var keys at the enclosing path); visibility via the `hidden` attribute + sc-if.scss (display: contents / [hidden] none)                                                                                                                     |
| sc-text, sc-flex, sc-row, sc-col                           | functional visual/layout wrappers over ui-components; row/col use a native 24-track CSS Grid, with the slotted sc-col host adopting the shared static span/offset/order rules for WebKit/Tauri compatibility                                                                                                                                                                                                                                                                                                                                                      |
| sc-group                                                   | functional: its own /g_new (created BEFORE its children, which target it via `targetGroupId`; nested groups nest); unload resets flags only — the subtree dies with the plugin group's wholesale teardown; a group-level control write /n_sets the group node (scsynth fans it out to every node inside). `run="false"` is not honored yet                                                                                                                                                                                                                        |
| sc-button                                                  | functional: renders the ui-components `<sc-base-button>` over the ScInput seam; write-only — `bind:value` MUST be a plain writable path (validateRuntimeProps); a click commits `set` when given (fixed-value trigger, runtime-capable as `bind:set`) else toggles 0 ↔ 1; `label`/`icon`/`disabled` are runtime props (`bind:icon="s1.gate ? 'stop' : 'play'"`)                                                                                                                                                                                                   |
| sc-console                                                 | functional leaf (the OSC console; no attributes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| sc-scope                                                   | functional + parametrized: tap props `bus`/`channels`/`frames` (the visible window in samples — default 1024, ≤ 16384) + renderer-only display props `trigger` (auto\|normal\|off — edge trigger on lane 0, lib/scope/trigger.ts), `slope`, `level`, `gain`, `layout` (overlay\|split), `range` (bipolar\|unipolar — envelopes/control taps fill the lane) — see scope.md §5. The element owns its tap (def + synth at the session-group tail + a scope slot from the session's span) through load/unload. NOT the old buffer-bound sc-scope (buffer-family step) |
| sc-strudel                                                 | functional + parametrized: `value` = initial pattern code; plain-path `bind:value` is two-way per keystroke, expression binds are read-only, and attribute `\\n` escapes decode to newlines; `orbit` stamps un-routed dirt events; editor mounts offline, unload stops playback                                                                                                                                                                                                                                                                                   |
| sc-keyboard                                                | NEW (no old-app counterpart): on-screen/tracker-row/Web MIDI piano spawning a transient voice per key from a referenced synthdef (`/s_new` into the plugin group, gate-0 release, ack-window race handling, focusout release-all); `bind:envelope` latches an Env.asArray value into each voice on the def's single array param; `freq`/`amp`/`gate` remap param names                                                                                                                                                                                            |
| sc-envelope                                                | NEW: the draggable-breakpoint envelope editor over an ordinary ARRAY-valued control/var (`bind:value` — writable plain path; Env.asArray codec in lib/synthdef/envValue.ts); gesture-frozen scale + edge pinning (no runaway feedback), `minbreakpoints`/`maxbreakpoints` lock the structure (positions stay draggable — stable `env.N` slot-lens binds), drag readout, double-click curve reset                                                                                                                                                                  |
| sc-buffer, sc-waveform, sc-test, old buffer-bound sc-scope | **not migrated** (buffer-family step)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

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
old-app-parity limitation: synthdef names are global to scsynth — two plugins
declaring the same name overwrite each other, and the SAME plugin mounted
twice (a dashboard box + the fullscreen PluginPage) shares one def per name:
unloading either instance /d_frees it under the other (running synths keep
playing; new /s_new — e.g. keyboard voices — fail until that instance
reloads).

**Connection lifecycle**: every mounted plugin lives with the connection —
ScPlugin subscribes to `oscClient.connected` (the ScopeController's pattern).
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
(`resolveRuntimeProps` → `resolveStateBind`, per prop) into
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
so they snap back. Writes split as `setValue()` (public, enabled+underived
only) over `dispatchValue()` (Object.is-vs-store guard + store write;
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
sc-select, sc-radio-group — `isTransparent`, internal/validation.ts) open
NO sibling scope and NO path segment — the parse walks through them
(`walkScElements`), so their contents parse into the ENCLOSING level,
share its duplicate-name check (a same-named var inside an sc-if fails
flat, `bad-if-shadow`), its bind scope, and its store paths. Attachment
walks through transparency too (`processParent`): `_parentScNode` IS the
nearest non-transparent ancestor — the owner every consumer needs
(ScControl's /n_set, name lookups over `_scChildren`) — and transparent
containers stay runtime-tree leaves (sc-select reads its option children
from the DOM). sc-if contents are therefore UNCONDITIONALLY
live — hiding is visual-only. The var must-be-on-a-node rule survives as a
defensive guard for genuinely non-node levels (inside a synthdef). Names
are syntax-validated as ONE bind-path segment (the spec `name` type — letters,
digits, `*`, `-`; no dots): a dotted name would forge another scope's store
key (`bad-name-syntax`; the XSD carries the same pattern facet, while the
runtime remains the authoritative gate). The old app's name-based
group→descendant SET_CONTROL propagation is deliberately NOT reproduced — a
group-level control's /n_set on the group node is the server-side
replacement (scsynth fans it out), plus explicit `bind:value="group.ctl"`.

Runtime layer: all old handlers ported (bind resolution incl. expressions
via lib/utils/expression parseBind/evalExpr — arithmetic, the
non-associative comparisons `> < >= <= == !=` evaluating to 1/0, the
right-associative ternary `? :`, and single-quoted string literals; a bare
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
mounts the authored `<sc-plugin>` root (text/xml parse + whole-root `importNode`),
and runs `host.processRoot()`. Functional examples must parse clean, and every parsed
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
`src/lib/osc/__tests__/{OscClient,middleware,logging,errors,status,watchdog}.test.ts`
cover protocol waiters, transport dispatch, per-concern observation, and
heartbeat expiry.

**End-to-end gate (the harness technique)**: when elements/parsers change,
validate every example through the real stack: run
`node scripts/validate-examples.mjs` against `yarn serve` + `yarn dev` +
headless Chrome (`--remote-debugging-port=9222`). What it does:

1. **Upload gate** — zip each `examples/<dir>` and `POST /api/plugins`:
   expect 201, except the upload fixtures `bad-metadata`, `bad-entry-xhtml`,
   `bad-entry-schema`, `bad-asset-type`, `bad-asset-mismatch` → 400 with
   their specific messages.
2. **Runtime gate** — for each installed plugin, over CDP `Runtime.evaluate`
   (with `awaitPromise`): fetch the entry via `/api/plugins/<id>/<entry>`, parse
   as **text/xml** (entries use self-closing tags; HTML parsing mis-nests them),
   require an authored `<sc-plugin>` root, `importNode` that whole root through
   the main document, explicitly upgrade it while disconnected, then
   `host.processRoot()` — the host's own parse-engine methods; nothing to import.
   PASS = no throw; the runtime `bad-*` fixtures must FAIL, each
   with its intentional resolveRuntime error (one per error path — see the
   `invalid/` table in examples/README.md). Any other failure is a migration
   bug — report it.
3. **Cleanup** — DELETE the plugins the run uploaded, keeping the user's
   registry as it was.

## Migration plan (old `sc-app/` → here)

The old app (see `sc-app/CLAUDE.md` for its full docs) is a declarative
SuperCollider control surface: plugin zips of XSD-validated XHTML rooted at an
authored `<sc-plugin>` and built from `sc-*` elements, parsed into a typed element tree, bound to live scsynth node
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
4. **`lib/html` + `lib/runtime`** — DONE, absorbed into `sc-elements`:
   element-tree parsing (cumulative scopes) and runtime processing (bind
   resolution, expressions, overrides) live on `ScElement`; these directories
   never materialized as separate layers.
5. **Core `sc-elements`** — DONE for the synth path AND the state layer:
   `OscClient.once(address, match)` reply matching (waiters in
   `handleReply`) + the scsynth command methods (the elements' whole OSC
   vocabulary), the sequential `load()`/`unload()` pass, sc-synthdef
   (sendSynthDef: compile + /d_recv + /sync ack; freeSynthDef), sc-synth
   (createSynth gated on /n_go into `targetGroupId` + the ack-window
   catch-up /n_set diff), the `_state`/"statechange" propagation (now the
   ScElement runtime-prop machinery)
   (see "Runtime values"), expression binds with comparisons, sc-if (a
   transparent container), and sc-group (its own /g_new; descendants nest via
   `targetGroupId`). **Remaining:** honoring `run="false"` after the create ack (the old app's exact
   create-then-/n_run sequence; the attribute is parsed but ignored today).
6. **Input elements** — DONE. Value dispatch over the shared state seam (see
   "Runtime values"), incl. dispatch to vars and sc-if. The shared `ScInput`
   seam carries the target `_state` subscription over the load/unload/
   disconnect lifecycle + `syncFromState` + the `commit()` snap-back writer,
   and every input renders its ui-components `sc-base-*` widget: sc-slider/
   sc-knob → `<sc-base-slider>`/`<sc-base-knob>`, sc-checkbox/sc-switch →
   `<sc-base-checkbox>`/`<sc-base-switch>` (checked ↔ 1/0), sc-select/
   sc-radio-group → `<sc-base-select>`/`<sc-base-radio-group>` (each option/
   radio child's `{value,label}` collected at parse and projected into the
   base widgets — the pattern sc-strudel uses for chips/buttons; knob and
   switch are distinct elements, not a `type`). All base props are forwarded.
   Testing seam (src/sc-elements/**tests**/controls.test.ts): spy
   `oscClient.send` with an auto-responder through `handleReply`; interaction
   tests drive the widgets' composed `input`/`change` in happy-dom (the
   `-base` widgets register via test-setup).
7. **Buffers & scopes — RE-SCOPED around the SHM transport** (the old
   /b_getn + global-clock machinery existed only because the old app had no
   SHM path; the new bus-based sc-scope already covers old sc-test and the
   old buffer-bound scope): port `sc-buffer` as a thin alloc/free element
   (/b_alloc gated on /done, /b_free on unload; bufnum binding into synth
   controls; bufnums as a server-assigned per-session span like the scope
   slots in core/blocks.rs — NOT the old client-side (clientID+1)\*100
   counter) and `sc-waveform` as a client-side recorder (record/pan/zoom
   over a growing Float32Array) fed by an SHM scope-tap subscription instead
   of /b_getn. `sc-test` is NOT ported (superseded by sc-scope's `bus`);
   the /b_getn reader + buffer WS + clock.rs stack is the fallback only if
   reading actual buffer CONTENTS (vs the live signal) becomes necessary.
   NOTE: the old sc-app CLAUDE.md's sc-test description (per-synth
   Phasor+SendTrig) is stale — its code uses a shared global-clock synth.
8. **Persistence & presets** — extend the saved-session layout payload with
   the old per-box `OverrideEntry[]` presets (replaces the old
   zustand-persist), marshalled as sparse diffs read from the element's
   per-instance runtime store via the mounted host's name-path walk —
   LITERAL keys only (derived values live on the elements and recompute; a
   preset writing a bound key would create an orphan store entry nothing
   reads).
9. **Shell polish** — settings (grid size, latency), logger; a ConnectScreen is
   likely unnecessary (sessions auto-connect).
10. **Examples & validation fixtures** — port `examples/` plugin zips (incl. the
    `bad-*` bundles) + packaging script; they are the acceptance tests for 4–7.
