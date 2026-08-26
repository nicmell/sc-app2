# sc-app2 — project overview

## What it is

sc-app2 is a control surface for live sound synthesis. It puts a modern,
plugin-based user interface in front of two engines from the live-coding
world — **SuperCollider's scsynth** (the synthesis server) and **Strudel**
(the TidalCycles-style pattern language) — and connects them through its
own Rust OSC bridge. It runs either as a native desktop app (Tauri) or as a
plain web app served to a browser; the interface is identical in both.

The core idea: instruments and control panels are **plugins written as
declarative markup**. A plugin is a small zip bundle containing an XHTML
entry file built from custom `sc-*` elements — sliders, knobs, scopes,
synth definitions, pattern editors — plus metadata and optional assets.
Authors describe *what* the instrument is (a synth, its parameters, the
widgets bound to them); the app takes care of everything else: validating
the markup, compiling synth definitions, creating server nodes, wiring
widget gestures to synthesis parameters, and drawing live signals.

A user's workspace is a **dashboard**: a grid of panels, each hosting a
plugin instance, arranged freely and persisted per session. Sessions
survive reloads — reopening the app restores the same layout against a
fresh synthesis state.

## What makes it interesting

- **A binding language in the markup.** Attributes can be bound to named
  values with expressions (`bind:value="vars.freq * 2"`,
  `bind:icon="s1.gate ? 'stop' : 'play'"`). Bindings are live: a knob
  writes a value, every dependent widget, display, and synth parameter
  updates. A deliberate rule — targets must be declared before they are
  referenced — keeps the dependency graph acyclic and the engine simple.
- **Synth definitions in markup too.** An `<sc-synthdef>` with `<sc-ugen>`
  children is compiled in the browser to SuperCollider's binary SynthDef
  format and sent to the server at load time; no sclang involved.
- **One validator everywhere.** Plugin markup is validated by a single Rust
  library, run natively when a plugin is uploaded and compiled to
  WebAssembly for instant validation in the browser. Errors are typed
  (stable codes, structured payloads, exact line and column) — the same
  shape from either gate.
- **Waveforms without polling audio through the network.** The bridge maps
  scsynth's shared-memory scope buffers directly and streams completed
  frames to the browser over the existing WebSocket — a low-latency
  oscilloscope with no extra audio path.

## Architecture in brief

Two processes talk three protocols:

```
Browser / webview  ── HTTP ──►  Rust server   (sessions, plugins, diag)
                   ── WS ────►  OSC bridge    (raw OSC, both directions)
Rust bridge        ── UDP ───►  scsynth :57110, SuperDirt :57120
```

**Frontend** (React 19 + Lit 3): a React shell — router, dashboard grid,
connection overlay, toast stack — hosting Lit custom elements for
everything inside a plugin. The parse engine walks the authored markup once
and turns the elements themselves into the runtime: runtime state lives as
plain fields on the components, and references between them are direct
element references. OSC encoding and the WebSocket live in a Web Worker,
which also runs an NTP-style clock estimator so the UI can schedule against
the bridge's clock.

**Backend** (Rust, tokio + axum): a generic UDP/OSC bridge with an
address-routed peer table; a supervisor that keeps the bridge registered
with scsynth and monitors it by heartbeat; an HTTP layer for session and
plugin management; and a per-WebSocket pump that ferries OSC frames while
guaranteeing that streamed scope data never delays control replies. All
server-side state (config, installed plugins, saved layouts, logs) lives
under a single **app root** directory shared by both run modes.

**Sessions**: each browser connection gets a session — a UUID, a private
block of scsynth node ids, and a group at the tail of scsynth's node tree.
The live session lasts exactly as long as its WebSocket; the identity and
the dashboard layout persist on disk, so the same URL revives the same
workspace.

**Validation and examples**: the example plugins under `examples/` double
as the acceptance suite — every functional example must load cleanly, and
every intentionally-broken fixture must fail with exactly the expected
error, enforced by both a fast unit gate (vitest + happy-dom) and a full
end-to-end gate that boots the entire stack against a throwaway app root
and drives a real browser.

## Repository shape

| area | contents |
| --- | --- |
| `src/` | frontend: React shell, `sc-*` elements, engine, stores, OSC client |
| `src-tauri/` | Rust backend: CLI, bridge, sessions, scope, HTTP router |
| `src-tauri/crates/sc-validate` | the shared validator + per-element specs (native + wasm) |
| `packages/` | workspace libraries: OSC command constructors, a SynthDef compiler with a full UGen catalogue, the base UI component kit |
| `examples/` | example plugins — documentation and acceptance suite in one |
| `scripts/` | dev stack, packaging, the end-to-end test framework |
| `docs/` | developer documentation (architecture, scope pipeline, clock) |

## Status

Pre-release. Nothing is deployed, so contracts (markup syntax, wire
formats, HTTP payloads) change outright without deprecation paths. The
element set covers nodes, synth graphs, state, inputs, visuals, and the
larger widgets (scope, pattern editor, keyboard, console); a buffer/
waveform family and a preset system are the main items on the roadmap.
