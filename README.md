# sc-app2

A control surface for live sound synthesis: a plugin-based UI in front of
**SuperCollider's scsynth** (the synthesis server) and **Strudel** (the
TidalCycles-style pattern language), connected through its own Rust OSC
bridge. Runs as a native desktop app (Tauri 2) or as a plain web app —
the interface (React 19 + Lit 3) is identical in both.

The core idea: instruments and control panels are **plugins written as
declarative markup**. A plugin is a zip bundle whose XHTML entry is built
from `sc-*` custom elements — sliders, knobs, scopes, synth definitions,
pattern editors — plus metadata and optional assets. Authors describe
*what* the instrument is; the app validates the markup, compiles synth
definitions, creates server nodes, wires widget gestures to synthesis
parameters, and draws live signals. A user's workspace is a **dashboard**
of plugin panels, persisted per session — reopening the app restores the
same layout against a fresh synthesis state.

## What makes it interesting

- **A binding language in the markup.** Attributes bind to named values
  with live expressions (`bind:value="vars.freq * 2"`,
  `bind:icon="s1.gate ? 'stop' : 'play'"`): a knob writes a value, every
  dependent widget, display, and synth parameter updates. A deliberate
  rule — targets must be declared before they are referenced — keeps the
  dependency graph acyclic and the engine simple.
- **Synth definitions in markup too.** An `<sc-synthdef>` with `<sc-ugen>`
  children compiles in the browser to SuperCollider's binary SynthDef
  format and is sent to the server at load time; no sclang involved.
- **One validator everywhere.** Plugin markup is validated by a single
  Rust library — native at upload, WebAssembly in the browser. Errors are
  typed (stable codes, structured payloads, exact line and column), the
  same shape from either gate.
- **Waveforms without an extra audio path.** The bridge maps scsynth's
  shared-memory scope buffers directly and streams completed frames over
  the existing WebSocket — a low-latency oscilloscope.

## Quick start

```bash
yarn                 # install
yarn osc             # scsynth + sclang/StrudelDirt (pre-req: `yarn deps`, once)
yarn dev:full        # frontend (:1420) + headless Rust server (:3000)
yarn tauri dev       # or: the full native app
```

## Repository shape

| area                            | contents                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/`                          | frontend: React shell, `sc-*` elements, parse engine, stores, OSC client                             |
| `src-tauri/`                    | Rust backend: CLI, OSC bridge, sessions, scope streaming, HTTP router                                |
| `src-tauri/crates/sc-validate`  | the shared validator + per-element specs (native + wasm)                                             |
| `packages/`                     | workspace libraries: OSC command constructors, a SynthDef compiler (bundled UGen catalogue), the UI kit |
| `examples/`                     | example plugins — documentation and acceptance suite in one                                          |
| `scripts/`                      | dev stack, packaging, the end-to-end test framework                                                  |
| `docs/`                         | developer documentation (architecture, scope pipeline, clock)                                        |

## Docs

- `CLAUDE.md` — working directives, conventions, recipes (start here)
- `docs/architecture.md` — the current architecture, end to end;
  `docs/scope.md` — the SHM scope pipeline; `docs/clock.md` — the bridge clock
- `src/sc-elements/README.md` — per-element docs;
  `src/lib/osc/README.md` — the OSC endpoint
- `examples/README.md` — the example plugins (also the acceptance suite)
- `TODO.md` — the backlog

## Testing

```bash
yarn test    # unit (vitest, happy-dom)
yarn e2e     # full stack on a throwaway app root (yarn smoke = boot only)
cd src-tauri && cargo test
```

The example plugins double as the acceptance suite: every functional
example must load cleanly and every intentionally-broken fixture must fail
with exactly the expected error, in both gates.

## Status

Pre-release. Nothing is deployed, so contracts (markup syntax, wire
formats, HTTP payloads) change outright without deprecation paths. The
element set covers nodes, synth graphs, state, inputs, visuals, and the
larger widgets (scope, pattern editor, keyboard, console); a
buffer/waveform family and a preset system are the main roadmap items.
