# scsynthdef-compiler

Rust builder, writer, and reader for the
[SuperCollider SynthDef File Format v2](https://doc.sccode.org/Reference/Synth-Definition-File-Format.html),
with wasm bindings used by `@sc-app/synthdef-compiler`.

## Source layout

`packages/synthdef-compiler/specs/ugens.json` and `envs.json` are the metadata
specs. The package generator emits committed, rustfmt-canonicalized registries
and supports `--check`:

- `src/ugens/`: 24 generated category files plus generated `mod.rs` and
  `wasm_gen.rs`; hand-written `wasm.rs` contains JS conversion helpers.
- `src/envs/`: hand-written `mod.rs` and `spec.rs`, plus generated `shapes.rs`.
- Hand-written `ugens_macro.rs`, `synthdef.rs`, `rate.rs`, `operators.rs`,
  `error.rs`, and crate-level `wasm.rs`.

There is no Rust-side UGen registry, lookup function, crate-local specs
directory, or build script. UGen and envelope metadata is consumed TS-side
from the package specs by `registry.ts` and `env-registry.ts`.

## Native Rust

```rust
use scsynthdef_compiler::ugens::{Out, SinOsc};
use scsynthdef_compiler::{Rate, SynthDef};

let mut def = SynthDef::new("sine");
let freq = def.add_control("freq", 440.0, Rate::Control)?;
let osc = SinOsc::ar().freq(freq).phase(0.0).build(&mut def);
Out::ar().bus(0.0).channels_array([osc]).build(&mut def);
let bytes = def.to_bytes()?;
# Ok::<(), scsynthdef_compiler::SynthDefError>(())
```

Each generated UGen struct exposes only its supported rate constructors,
typed setters, and `build(&mut SynthDef) -> UGenInput`. `SynthDef::from_bytes`,
`to_json`, and `from_json` provide the inspection round trips.

## WebAssembly boundary

The wasm build exports the core `SynthDef` class and a generated class per
buildable UGen. Calls such as `SinOsc.ar({ freq })` attach to the ambient build
established by a synchronous graph callback:

```ts
const def = new SynthDef("sine", (def) => {
  const freq = def.addControl("freq", 440, "control");
  Out.ar({ bus: 0, channelsArray: [SinOsc.ar({ freq })] });
});
```

Nested ambient builds stack. Async callbacks are rejected, and a typed UGen
builder called outside an active build reports that no SynthDef build is
active. The low-level `addUgen` API is also available.

## Regeneration and tests

From the repository root:

```bash
yarn generate:synthdef-compiler
yarn tsx packages/synthdef-compiler/scripts/generate-rust.ts --check
cargo test -p scsynthdef-compiler --manifest-path src-tauri/Cargo.toml
cargo run -p scsynthdef-compiler --manifest-path src-tauri/Cargo.toml --example sclang_parity
```

The yarn generation command runs the TypeScript generator before wasm-pack.
The package Vitest suite checks drift and stray committed registry files. The
Rust parity harness covers its four current fixtures, including the
array-control/EnvGen case.
