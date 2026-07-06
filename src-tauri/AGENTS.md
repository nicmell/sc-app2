# Agent Guidance: `src-tauri`

## Backend Shape

The Rust side has two layers:

- `src/cli/` is the command surface and Tauri GUI bootstrap.
- `src/core/` is the application engine: config, logger, OSC bridge, scsynth supervisor,
  sessions, layouts, plugin validation, scope streaming, HTTP/WS router, and server facade.

`core::start` is the composition root used by both GUI and headless serve modes. Keep the GUI
and CLI paths sharing the same core behavior.

## Transport And Session Rules

- The webview and browser talk to the backend over plain HTTP/WS. Do not add Tauri IPC for app
  runtime behavior.
- A live session lives as long as its WebSocket. Session identity and dashboard layout persist
  server-side.
- Scope subscriptions are session-span gated. Do not bypass block/span allocation in
  `core/blocks.rs`.
- `/scope/*` is bridge-internal and must not be routed to external OSC peers.
- Server shutdown should free live session groups and notify scsynth consistently.

## Plugin Validation And XSD

Plugin upload validation lives under `src/core/plugin/`. The XSD is:

```text
src/core/plugin/xsd/sc-plugin-schema.xsd
```

Keep it in sync with frontend `sc-*` elements, examples, and validation tests. If a frontend
element tag, attribute, or content model changes, update this schema in the same change until
XSD code generation exists.

`fastxml` is pinned to `=0.8.0` because later versions reject mixed-content models this app
relies on. Do not upgrade without proving every example and upload fixture still validates.

## Checks

```bash
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
yarn clippy
yarn fmt:rust:check
```

For plugin validation or schema changes, also run the example validation harness when feasible:

```bash
node scripts/validate-examples.mjs
```
