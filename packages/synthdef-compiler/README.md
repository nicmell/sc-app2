# @sc-app/synthdef-compiler

SynthDef → SCgf v2 compilation for the app — a thin layer over the
**wasm-bindgen build** of the vendored `scsynthdef-compiler` Rust crate
(`src-tauri/crates/scsynthdef-compiler`). One compiler implementation shared
by the Rust backend (native rlib) and the frontend.

## Layout

- `pkg/` — the wasm-pack output (glue + wasm + `.d.ts` + the `init.js`
  dual-environment loader). **Generated and committed** — regenerate with
  `yarn generate:synthdef-compiler` whenever the specs or crate change
  (prereqs: `rustup target add wasm32-unknown-unknown`,
  `cargo install wasm-pack`).
  The generate command first runs `scripts/generate-rust.ts`, which reads
  `specs/{ugens,envs}.json` and refreshes the crate's committed per-category
  registries and builders before wasm-pack.
- `src/component.ts` — init + the compiler core: the `SynthDef` class
  (`addControl`/`addControlArray`/`addUgen`/`nodeRate`/`toBytes`/`toJson`),
  typed `parseScgf`, `binaryOpIndex`/`unaryOpIndex`,
  `buildEnvRun`/`encodeEnvRun`.
- `src/registry.ts` — `lookupUgen`/`ugensByCategory` over ONE cached
  `registryJson()` call; the SCDoc-reconciled data lives in the crate.
- `src/env-registry.ts` — `ENV_SHAPES`/`lookupEnv` with per-entry
  `buildRun(args, opts)`; modulatable-slot rules enforced crate-side with
  pinned error strings (`adsr: "sustain" is not modulatable`).
- `src/ugen-input.ts` — `k`/`u`/`uo`/`ugenIndex`/`outputIndex` over the
  serde shape `{ constant: n } | { ugen: i } | { ugenOutput: [i, o] }`.
- `./builders` subpath — the generated typed builder fns
  (`SinOsc.ar({ freq })` inside a `new SynthDef(name, (def) => …)` graph
  callback — the ambient build; absent args keep registry defaults).

## Usage

```ts
import { SynthDef, k, u, lookupUgen } from "@sc-app/synthdef-compiler";

const def = new SynthDef("sine");
const freq = def.addControl("freq", 440, "control");
const osc = def.addUgen("SinOsc", "audio", [freq, k(0)], 1, 0);
def.addUgen("Out", "audio", [k(0), u(osc)], 0, 0);
const bytes = def.toBytes(); // SCgf v2, byte-identical to sclang
```

## Notes

- Byte parity with sclang is pinned by the crate's parity harness
  (`cargo run -p scsynthdef-compiler --example sclang_parity`) — 4 fixtures
  incl. an array-control + EnvGen def.
- Env runs and control defaults carry wire (float32) precision; tests
  compare via `Math.fround`.
- Tests (`yarn workspace @sc-app/synthdef-compiler test`) run the REAL wasm
  in node. A generator test catches drift in the committed Rust output.

## Regeneration

Edit `specs/ugens.json` or `specs/envs.json`, then run:

```bash
yarn generate:synthdef-compiler
```

For the committed Rust sources only, use
`yarn tsx packages/synthdef-compiler/scripts/generate-rust.ts` (or add
`--check`). The generator emits `src/specs/` and `src/builders/` by category,
plus `builders_wasm_gen.rs` and `env_shapes.rs`, canonicalized through rustfmt
stdin. The crate then builds entirely from those committed files; it has no
`build.rs` or shared spec-schema crate.
