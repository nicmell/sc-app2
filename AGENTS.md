# Agent Guidance

## Project Shape

This repo is `sc-app2`: a Tauri 2 + React 19 + Lit 3 desktop/browser app for controlling
SuperCollider and Strudel through a Rust OSC bridge.

The app is the successor to the old `sc-app/` checkout. Treat `sc-app/` as historical
reference only unless a task explicitly asks for migration work from it.

Main areas:

- `src/` - frontend app, React shell, Lit `sc-*` runtime elements, stores, OSC/session code.
- `src/sc-elements/` - trusted plugin HTML runtime. The custom element is the parsed runtime
  object; there is no separate parser-item layer.
- `src-tauri/` - Rust CLI, GUI bootstrap, HTTP/WS server, plugin upload validation, OSC bridge.
- `packages/ui-components/` - framework-agnostic `sc-base-*` Lit UI components and design
  foundations consumed by the host and `sc-elements`.
- `packages/synthdef-compiler/` - SynthDef graph/compiler package.
- `packages/server-commands/` - OSC command constructors and wire helpers.
- `examples/` - plugin fixtures used by both frontend unit tests and backend upload/runtime
  validation.

Read `CLAUDE.md` for the long-form architecture. This file is the compact contract for future
agents.

## Commands

Use Yarn 4. Common checks:

```bash
yarn build
yarn typecheck
yarn lint
yarn test
yarn test:all
yarn clippy
yarn fmt:rust:check
```

Development commands:

```bash
yarn dev        # Vite frontend on 1420
yarn serve      # headless Rust server on config.json port, usually 3000
yarn dev:full   # frontend + server
yarn tauri dev  # native app
yarn osc        # local scsynth + sclang/StrudelDirt prerequisite
```

When parser, element, schema, plugin validation, or example behavior changes, also consider the
real-stack gate:

```bash
node scripts/validate-examples.mjs
```

That harness expects the Rust server, Vite, and a Chrome CDP endpoint as documented in
`CLAUDE.md`.

## Coding Conventions

- TypeScript is strict. Prefer type-only imports for cross-domain types when possible.
- Use `@/` for cross-directory frontend imports; use relative imports within the same folder.
- Keep singleton ownership where it is now: `oscClient`, `workerClient`, and `session` are
  exported by their defining modules.
- Do not add a second global store. `src/stores/store.ts` is the single app store.
- Keep comments sparse and useful. Existing element files often start with a short contract
  comment; update it when the contract changes.
- Avoid unrelated refactors. Many tests pin exact parser and validation behavior.
- `fastxml` is intentionally pinned to `=0.8.0`; do not bump it casually.

## Runtime Invariants

- The `sc-*` element instance is the runtime object. Do not reintroduce parser item structs,
  copied prop bags, `type` discriminants, or nested `runtime` objects.
- Reactive attributes live on the element class with Lit decorators.
- Runtime-only values live on the element as fields, usually inherited from the category bases.
- Live state is `_state` on `ScDerived`; readers subscribe through `onStateChange()`.
- Literal, user-writable state is stored in the runtime store. Bound/derived state is not.
- Bind targets must be declared before references in DOM order. Keep that constraint enforced.
- The load pass is strict DOM order; unload walks in reverse.
- Elements should talk to scsynth through `OscClient` command methods, not raw sends.

## Schema And Examples

The backend XSD in `src-tauri/src/core/plugin/xsd/sc-plugin-schema.xsd`, frontend element
declarations, and `examples/` fixtures must move together. If an element tag, attribute,
content model, or validation rule changes, update all of:

- `src/constants/sc-elements.ts`
- `src/sc-elements/index.ts`
- the element class and tests
- `src-tauri/src/core/plugin/xsd/sc-plugin-schema.xsd`
- relevant `examples/**/index.html` or `entry.html`
- `src/sc-elements/__tests__/examples.test.ts` expectations when fixture outcomes change

`XSD-CODEGEN-DRAFT.md` is a planning document, not implemented behavior. Until codegen lands,
the committed XSD remains hand-maintained.

## Branch Context

The current feature branch intent is to move logical plugin inputs onto the shared
`@sc-app/ui-components` base widgets:

- `sc-range` has been renamed to `sc-slider`.
- `sc-knob` and `sc-switch` have been added as input siblings.
- `sc-checkbox`, `sc-select`, `sc-radio-group`, and `sc-radio` now wrap base UI components.
- `ScInput` owns the shared read/write seam from bound state to UI widgets.
- Examples and the backend schema were updated to the new input surface.

When changing this area, preserve the separation: `packages/ui-components` stays UI-only,
while `src/sc-elements/inputs` owns bind resolution, live state sync, and write semantics.
