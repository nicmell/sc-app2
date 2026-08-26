# LLM working notes

Operational knowledge for AI models working on this codebase — the tacit
layer beneath CLAUDE.md and docs/. Nothing here duplicates the doc map;
these are the traps, sync points, and workflow facts that are easy to get
wrong and expensive to rediscover.

## Mental model in five sentences

1. A plugin is declarative XHTML of `sc-*` custom elements; **the element
   IS the runtime** — parsing mutates the components in place, there are no
   parallel item structures and no id-keyed registry.
2. **Bind targets must be declared before their references in DOM order**,
   which makes the bind graph a DAG by construction and DOM order a valid
   load/build order — half the engine's simplicity hangs off this.
3. The per-element spec (`sc-validate`'s `specs/<tag>.spec.json`) is the
   single attribute contract: it drives the Rust upload gate, the wasm
   `parseEntry` gate, AND frontend `getProp` coercion. Change the spec,
   everything follows; change anything else, nothing does.
4. A live session is exactly one WebSocket; identity and layout persist
   server-side under the app root, everything live dies with the socket.
5. The wire is raw OSC bytes end to end (worker codec ⇄ WS ⇄ UDP, never
   rewritten); the only intercepted families are `/scope/*` and `/clock/*`.

## Cross-boundary sync points (change one side → sweep the other)

- `router/error.rs` codes ⇄ `ApiErrorCode` union in `src/lib/http`.
- `core/clock.rs` ⇄ `packages/server-commands/src/commands/clock.ts`
  (ping/pong arg layouts; only ping/pong are on the wire).
- `scope/wire.rs` ⇄ the frontend's `parseScopeChunkArgs` (golden byte tests
  pin the encoding).
- `ELEMENTS` (src/constants) ⇄ constructor `REGISTRY` (sc-elements/index)
  ⇄ `SPEC_SOURCES` (spec.rs) — a vitest pins the bijection.
- Any `sc-validate` crate change that alters the generated pkg requires
  `yarn generate:wasm` and committing the regenerated
  `src-tauri/crates/sc-validate/pkg` in the SAME commit (CI drift job
  fails otherwise). Even doc-comment changes leak into the generated d.ts.

## Message and behavior pinning

- Validation violation messages, codes, and positions are pinned
  **byte-exact** by `sc-elements/__tests__/examples.test.ts` (unit) — every
  wording change must update the pins. The e2e suites pin only PASS/FAIL
  sets and status codes, never message text.
- Each runtime `bad-*` example fixture exists to hit exactly one error
  path; the mapping table is in `examples/README.md`. Adding an error path
  usually means adding a fixture.

## Editing gotchas (each of these has actually bitten)

- **macOS filesystem is case-insensitive**: `git rm todo.md` deletes
  `TODO.md`. Check paths before removal.
- **cargo fmt reflows comments and strings** — a scripted string
  replacement prepared against pre-fmt text will silently miss. Always
  verify replacements applied (grep after), never assume.
- **`yarn format` (prettier) rewrites markdown** — reflowing tables and
  wrapping; run it before committing doc edits or the next contributor's
  format pass will bury your diff.
- **clap doc comments are `--help` output**: rustdoc markup (backticks,
  angle brackets) in `cli/` doc comments shows up literally in the
  terminal. Angle brackets also break rustdoc as unclosed HTML tags.
- **tsify cannot flatten a Rust enum into a TS union**: `#[serde(flatten)]`
  emits `interface extends <union>` — invalid TS that `skipLibCheck`
  silently degrades (union members vanish, no error). Nest tagged enums
  (the `kind` field pattern) instead. `skipLibCheck` itself is required at
  the app level (DOM + webworker stdlib conflict) — don't remove it.
- **`SC_APP_DIR=""` must behave like unset** — env handling lives in the
  CLI dispatch, not clap's `env` attribute (which hard-errors on empty).
- **Rust tests share one process-wide app root** (`install_test_root`,
  first caller wins, pid-named tempdir): only one test binary may write a
  given registry — don't add a second suite writing plugins.json.
- **CatchPanicLayer must sit INSIDE CorsLayer** — otherwise panic 500s
  lack CORS headers and are unreadable from the Tauri webview.

## Runtime semantics that are easy to get wrong

- `getProp` is untyped by design; cast at the call site. A spec `default`
  is coerced like a static value; undeclared attrs stay `undefined` so the
  base widget's own default wins.
- No runtime `name`/`run` fields — values duplicating a declarative prop
  are unified. `value` is the plain attribute mirror; the LIVE value is
  `_state` (store-backed for literals, recomputed for binds), notified via
  "statechange".
- Bind attributes are matched by QUALIFIED name — `getAttribute("bind:x")`,
  never `getAttributeNS` (the one portable choice across happy-dom and
  Chrome).
- Transparent containers (sc-if, sc-select, sc-radio-group) open no scope
  and no path segment; their contents are unconditionally live — sc-if
  hiding is visual-only.
- References resolve to LIVE ELEMENTS, never ids; anything persisted
  (layout, future presets) must stay name-path-based.
- The load pass is strictly sequential in DOM order, each child fully
  awaited; every scsynth exchange goes through an OscClient command method
  with the reply waiter registered BEFORE the send. `handleReply` is the
  unit-test seam.

## Test and dev workflow facts

- `yarn test` runs three workspaces (app + synthdef-compiler +
  ui-components); the grep-friendly totals print per workspace.
- happy-dom cannot import the strudel editor stack (aliased to stubs in
  vite.config.ts `test.alias`) and has no top layer/layout — anything
  positional belongs in e2e, not vitest.
- e2e: owned mode refuses to start if UDP 57110 is bound (never adopt a
  developer's scsynth); attach mode must stay non-mutating in health checks
  and must NEVER delete plugins (uploads replace via name+version dedupe;
  a delete would remove the developer's own synced copies). Teardown kills
  only spawned process groups — no pkill of any kind. Use the
  `scripts/e2e/` framework for browser probes; hand-rolled CDP probes have
  been rebuilt and re-broken enough times.
- A running `serve` re-reads the plugin registry per request — after
  `yarn examples:sync` only the browser needs a reload. The CLI and a
  running server both rewrite plugins.json unlocked (accepted dev race).
- The e2e/browser 409 `session-busy` trap: the session id lives in
  per-origin localStorage shared by all tabs; a stale tab or stored id
  revives the session under a dying socket. Clean-slate = close app tabs +
  clear storage (the framework's `freshTab()` does both).
- React StrictMode double-invokes effects: SessionManager defers disconnect
  one tick and no-ops a same-info reconnect — don't "fix" apparent
  double-connects without reading its header first.

## Documentation discipline

- One owner per fact (see CLAUDE.md "Documentation policy"); prose changes
  ride the same commit as the code; before closing a branch, grep docs and
  comments for every symbol the branch renamed or deleted — stale doc
  references are this repo's most common regression.
- Rust mechanism docs are rustdoc; keep
  `cargo doc --no-deps --document-private-items` warning-free.
- Pre-release policy: no deprecation shims, no migration hints — breaking
  changes sweep every usage (examples, tests, docs) in one commit.
