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
  There is **no Tauri IPC** — the webview talks plain HTTP/WS like any browser.
* **Serve** (`sc-app2 serve`): the same server headless; browsers are same-origin
  (or Vite-proxied in dev) and `HTTP_BASE_URL` is `""`.

### Frontend (`src/`)

```
main.tsx                 boot: register sc-* elements, session.start(), render <App/>
components/              React shell: Dashboard grid, plugin picker/list, toasts
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
                         process/processChildren) + the shared bind-resolution
                         machinery and the common runtime fields; the category
                         bases (sc-node/sc-state/sc-input, the old app's
                         names) declare the category props + runtime values;
                         each component overrides resolveRuntime(), whose
                         result process() assigns onto the element itself
runtime/                 the global parsed-element registry (id → the live
                         ScElement component), deliberately NOT a store slice
stores/                  the single app store + slices and React hooks
  store.ts               createStore({ session, layout, plugins }) — the ONLY store.
                         Cross-module shapes come from @/types (type-only by
                         construction), so no runtime cycle with the singletons.
  layout.ts / plugins.ts / session.ts / useStore.ts
types/                   .d.ts domain shapes (old sc-app convention):
                         stores.d.ts (app state), api.d.ts (HTTP payloads),
                         osc.d.ts (transport), sc-elements.d.ts (JSX tags),
                         runtime.d.ts (the element runtime tree + ScXProps)
constants/               per-domain constants (as-const maps + defaults):
                         env (HTTP_BASE_URL), osc (OSC_REPLIES, scope tap),
                         session, layout (grid), sc-elements (ELEMENTS), store (SliceName)
lib/                     non-React infrastructure
  http/                  get/post/put/patch/del prefixed with HTTP_BASE_URL, wsUrl(),
                         HttpError (carries the response body, e.g. plugin validation errors)
  osc/                   the OSC transport (see lib/osc/README.md):
                         OscClient (global `oscClient`, mirrors the osc-js OSC class,
                         owns /g_new of the session group + nextNodeId allocation)
                         → WebsocketWorkerPlugin (osc-js Plugin impl)
                         → worker.ts (Web Worker owning the WebSocket; bytes only)
  session/SessionManager (global `session`): mints/revives the session over HTTP,
                         connects oscClient, routes replies (status/fail/late → store),
                         tx/rx OSC console log, 10s layout autosave
  scope/                 ScopeController: master-out tap synthdef + /scope/chunk → chunkRef
  plugins/PluginManager  plugin CRUD + entry-HTML loading over /api/plugins
  strudel/               Strudel bootstrap (prebake) for sc-strudel
  utils/reactiveStore    the minimal store implementation (slices, select, subscribe)
```

Conventions: `@/` alias = `src/` (tsconfig `paths` + vite `resolve.alias`);
cross-directory imports use `@/…`, same-directory imports stay relative. Module
singletons (`oscClient`, `session`) are exported by their defining module.
No linter/formatter configured — TypeScript strict mode + existing patterns.

### Session lifecycle

A **live session lives exactly as long as its WebSocket**; its **identity and
dashboard layout persist** server-side:

1. Boot: `localStorage["sc.session"]` → `GET /api/session/{id}` **revives** the
   saved session under the same UUID (fresh node-id block) and returns the saved
   layout; on any failure fall back to `POST /api/session` (new id, stored back).
2. `oscClient.connect(wsUrl, block)` opens the WS (in the worker) and sends
   `/g_new` — the session group lives **at the tail of scsynth's root group 0**;
   synth ids come from `oscClient.nextNodeId()` over the server-assigned block.
3. Every 10 s the SessionManager `PUT`s the layout to `/api/session/{id}` when it
   changed; the server stores it under the app data dir (see below).
4. WS close (reload/quit) → the server ends the session and frees its group.
   Server shutdown frees all live session groups one by one, then `/notify 0`.

### Backend (`src-tauri/src/`)

```
lib.rs            CLI (serve | GUI) + composition root (bridge → scsynth → server → router)
config.rs         config.json (port, peers, log_dir) + app-data-dir paths
core/bridge.rs    UDP peers (scsynth, strudel) ⇄ broadcast fan-out, pattern routing
core/scsynth.rs   supervisor: /notify registration, clientID, /status heartbeat,
                  node-id partitioning (cid<<26 blocks, per-session SESSION_SPAN
                  sub-blocks), group free helpers
core/sessions.rs  live-session store (Uuid → block, index recycling)
saved_sessions.rs saved layouts: sessions.json registry + sessions/<id>.json
plugin/           zip validation (metadata, XSD entry, assets) + plugins.json registry
router/           axum: session.rs (POST/GET-revive/PUT-layout/DELETE),
                  ws.rs (per-socket OSC pump; /scope/* intercepted; ends the
                  session on close), plugin.rs, diag.rs, assets.rs
scope.rs          scsynth SHM scope buffers → /scope/chunk frames over the WS
server.rs         app logic glue (axum State): session mint/revive/end, scope SHM
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

## Workspace packages (`packages/`)

* `@sc-app/server-commands` — scsynth OSC command constructors over osc-js
  (`sNew`, `dRecv`, `gNewOne`, scope subscribe/chunk parsing, encode/decode,
  timetags). The frontend's only OSC vocabulary.
* `@sc-app/synthdef-compiler` — SynthDef → SCgf compilation (used by lib/scope's
  tap def).
* `@sc-app/ui-foundation` — base styles/custom-element foundation.

## Migrating an sc-element (the recipe)

The element architecture settled with the first migrated batch — follow it for
every further `sc-*` element:

1. **Tag**: add it to `ELEMENTS` (`src/constants/sc-elements.ts`), the
   constructor `REGISTRY` (`src/sc-elements/index.ts`), and the backend XSD
   (`src-tauri/src/plugin/xsd/sc-plugin-schema.xsd` — declaration, complex
   type, content-model group). The JSX augmentation grows automatically.
2. **Attributes live on the component, not the item.** Declare them as
   standard-decorator reactive properties — `@property({ type: Number })
   accessor min = 0;` — implementing the element's `ScXProps` interface from
   `src/types/runtime.d.ts`. (Vite lowers the decorators via
   `esbuild.target: "es2022"`; attribute→property conversion replaces hand
   parsing. Use the shared `runAttribute` converter for `run="false"`
   semantics.)
3. **Validation is colocated**: override `validate()` on the component (base
   helpers: `requireProp`, `requireNumeric`, `requireNoScChildren`,
   `failValidation`). `hydrate` calls it during parse and a violation fails
   the whole plugin. This is the *real* gate — fastxml does not enforce XSD
   attribute requirements at upload.
4. **Runtime values live ON the element** — there are no item structures.
   Declare them as plain (non-reactive) fields on the component, or inherit
   them from the category base (`internal/sc-node`: nodeId/loaded + run;
   `internal/sc-state`: name/value/bind + targets/expression + the shared
   validation; `internal/sc-input`: bind + targetId); the common core
   (rootId/parentId/path/enabled + `scChildren` for parents — named so
   because DOM `children` is taken) is on `ScElement`. The mixin contracts
   (`BaseRuntime`/`NodeRuntime`/`StateRuntime`/…) live in
   `src/types/runtime.d.ts` as `resolveRuntime` return types, next to the
   `ScXProps` interfaces. Values that duplicate a reactive prop are unified
   with it, never copied (no runtime `name`/`run`; enabled state resolves
   into its `value` prop — disabled graph inputs keep the prop as the plain
   attribute mirror). There is **no `type` field**: the discriminant is the
   tag (`typeOf(el)`, `lib/utils/guards`), and the guards narrow to the
   component classes via type-only imports.
5. **Runtime resolution**: override `resolveRuntime(ctx)` on the component —
   the parse engine + shared bind-resolution machinery are inherited from
   `ScElement` (`internal/sc-element.ts`): call `this.processChildren(ctx)`
   if the element parses children, resolve binds via `this.resolveStateBind`
   / `this.resolveVisualBind` / `this.resolveNode`, and return the runtime
   values over `this.baseRuntime(ctx)` / `this.nodeRuntime(ctx)` (the base
   `process(ctx)` assigns them onto the element). `ctx` is the per-LEVEL
   state ({rootId, nodes, scope, parentNode, path}) shared by all siblings.
   The default is the self-contained leaf. Extend `lib/utils/guards.ts` if
   the element joins a category (state/node/parent). Add the element's
   examples to the unit suite's expectations (`tests/examples.test.ts`) if
   it ships a new fixture.
6. The registry (`@/runtime/registry`) maps ids to the live components
   themselves (identity verified by the ScElement firstUpdated test), so
   props, runtime values, and methods are reachable from outside the DOM.

## Migration state (elements)

| element | status |
|---|---|
| sc-plugin | functional root: loads/parses entry, owns the plugin scsynth group |
| sc-group, sc-synthdef, sc-ugen, sc-control, sc-var, sc-synth | **stubs**: parsed + validated + bind-resolved; no OSC behavior yet |
| sc-range, sc-checkbox | **stubs** with unstyled native inputs; no control propagation |
| sc-run, sc-display, sc-if, sc-select, sc-option, sc-radio-group, sc-radio | **stubs**: parsed + validated + bind-resolved; no UI/logic |
| sc-console, sc-scope, sc-strudel | functional leaves (new-app features; sc-scope is the SHM master-out scope) |
| sc-buffer, sc-waveform, sc-test, old buffer-bound sc-scope | **not migrated** (buffer-family step) |

Runtime layer: all old handlers ported (bind resolution incl. arithmetic
expressions via lib/utils/expression parseBind/evalExpr) except buffers,
presets/overrides, and synthdef compilation. Examples: every old example
without a buffer-family element lives in `examples/<category>/` (see
examples/README.md — app/synths/bindings/inputs/invalid);
`scope-plugin`, `test-plugin`, `waveform-plugin` stay behind.

**fastxml is pinned to =0.8.0** (src-tauri/Cargo.toml): 0.8.1+ rejects
mixed-content models whose choices have minOccurs="0" (a text-only `<span>`
fails), which the old app never hit because it locked 0.8.0.

## Validating example plugins (the two gates)

**Unit gate (fast, run on every change)**: `yarn test` — vitest + happy-dom
(`tests/examples.test.ts`). Loads every example entry via `import.meta.glob`,
mounts it into a connected `<sc-plugin>` host (text/xml parse + importNode),
and runs `host.hydrate(...)` + `host.process(tree, {rootId, nodes, scope:
[tree], path:[]})`. Functional examples must parse clean; the runtime `bad-*`
fixtures must fail with their **exact** message; plus structural assertions
(flat runtime merge, range bind targets, `_element` identity). The strudel
editor stack is vi.mock'ed (browser-only deps); the five upload fixtures are
backend validation and are excluded here.

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
   children into the host, then `host.hydrate(randomId())` +
   `host.process({rootId: host.id, nodes: new Map(), scope: [host],
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
2. **`lib/ugen` + `assets/ugens` + `lib/synthdef`** — UGen registry (Overtone
   metadata + `generate_ugen_db.mjs`), graph builder, SCgf encoder,
   SynthDefCompiler/Manager. Reconcile with `@sc-app/synthdef-compiler`.
3. **`types/` + `constants/` + `lib/utils`** — parser types, guards, the bind
   expression parser.
4. **`lib/html` + `lib/runtime`** — element-tree hydration (cumulative scopes)
   and runtime processing (bind resolution, expressions, overrides). Grow the
   current innerHTML plugin loading into the two-phase pipeline; the Rust XSD
   validation stays as-is.
5. **Core `sc-elements`** — `internal/` bases, then
   `sc-plugin/group/synth/synthdef/ugen/control/var`, wired to the current
   transport: add the old `OscService.once()` reply-matching pattern to
   `OscClient`; node ids via `nextNodeId()`, groups nested in the session group.
6. **Input elements** — stubs are in; remaining: the knob/slider/switch/
   combobox internals, condition logic, value dispatch + a `runtime` store
   slice carrying control values (`/n_set`).
7. **Buffers & scopes** — port `sc-buffer`/`sc-waveform`/`sc-test` with the old
   `/b_getn` streaming machinery (Rust `buffer_ws.rs`-style per-buffer WS);
   keep the current SHM master-out scope as-is.
8. **Persistence & presets** — extend the saved-session layout payload with the
   old per-box `OverrideEntry[]` presets (replaces the old zustand-persist).
9. **Shell polish** — settings (grid size, latency), logger; a ConnectScreen is
   likely unnecessary (sessions auto-connect).
10. **Examples & validation fixtures** — port `examples/` plugin zips (incl. the
    `bad-*` bundles) + packaging script; they are the acceptance tests for 4–7.
