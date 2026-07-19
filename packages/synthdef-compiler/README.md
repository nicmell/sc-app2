# @sc-app/synthdef-compiler

SynthDef-to-SCgf-v2 compilation for the app, backed by the wasm build of
`src-tauri/crates/scsynthdef-compiler`.

## Layout

- `specs/ugens.json` and `specs/envs.json` are the metadata specs.
- `scripts/generate-rust.ts` emits committed, rustfmt-canonicalized Rust
  registries: 24 UGen category files, `ugens/mod.rs`, `ugens/wasm_gen.rs`, and
  `envs/shapes.rs`. `--check` detects drift and the package tests reject stray
  generated files.
- `pkg/` is committed wasm-pack output. `yarn generate:synthdef-compiler` runs
  the generator before wasm-pack.
- `src/component.ts` re-exports the wasm compiler core: `SynthDef`, SCgf
  parsing, operator lookup, and envelope building/encoding.
- `src/builders.ts` re-exports the generated wasm UGen classes.
- `src/registry.ts` and `src/env-registry.ts` consume the package spec JSON
  directly. No Rust-side UGen lookup registry crosses the wasm boundary.
- The remaining `src` modules provide UGen-input, rate, and structured-JSON
  helpers; `src/index.ts` is the package re-export shell.

## Usage

```ts
import { Out, SinOsc, SynthDef } from "@sc-app/synthdef-compiler/builders";

const def = new SynthDef("sine", (def) => {
  const freq = def.addControl("freq", 440, "control");
  Out.ar({ bus: 0, channelsArray: [SinOsc.ar({ freq })] });
});

const bytes = def.toBytes();
```

Generated UGen classes attach to the ambient build established by the
synchronous `new SynthDef(name, (def) => …)` callback. Nested builds stack;
an async callback is rejected, and calling a typed UGen builder outside an
active build produces a pointed error. Absent arguments retain spec defaults.

The lower-level `def.addUgen(...)` API remains available when a dynamic graph
does not fit the generated class surface. `lookupUgen`, `ugensByCategory`,
`ENV_SHAPES`, and `lookupEnv` read metadata TS-side from the committed specs.

## Regeneration

After editing either spec, run:

```bash
yarn generate:synthdef-compiler
```

To generate or check only the committed Rust registries:

```bash
yarn tsx packages/synthdef-compiler/scripts/generate-rust.ts
yarn tsx packages/synthdef-compiler/scripts/generate-rust.ts --check
```

The crate has no build script or Rust-side UGen registry. Package tests run
the real wasm and check generator drift and stray generated files.
