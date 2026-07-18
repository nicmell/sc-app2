# scsynthdef-compiler

Spec-only Rust library for the SuperCollider SynthDef File Format v2
([spec](https://doc.sccode.org/Reference/Synth-Definition-File-Format.html)).
Compiles `.scsyndef` bytes that scsynth accepts, and parses them back.

## Layers

- **`SynthDef`** — the builder / reader. `to_bytes` / `from_bytes` /
  `to_json` / `from_json` cover the four round-trip entry points.
- **`builders::*`** — a typed struct per bundled UGen (~347 total),
  emitted by `build.rs` from `assets/specs/ugens.json`. Each
  struct exposes `ar()` / `kr()` / `ir()` constructors (only those rates
  the UGen supports), setter methods per arg (with rustdoc from the
  source catalogue), and `build(&mut SynthDef) -> UGenInput`.
- **`registry::lookup_ugen` + `ugens_by_category`** — metadata access
  for documentation browsers and generators.

## Usage

### From Rust — typed `builders::*` API

Each UGen is a generated struct with `ar()` / `kr()` / `ir()`
constructors (only the rates SC actually supports), typed setter
methods per arg, and a terminal `.build(&mut SynthDef) -> UGenInput`
that appends the UGen to the graph and returns a handle usable as
another UGen's input.

```rust
use scsynthdef_compiler::builders::{Out, SinOsc};
use scsynthdef_compiler::{Rate, SynthDef};

let mut def = SynthDef::new("sine");

// Add a kr control — it returns a UGenInput handle.
let freq = def.add_control("freq", 440.0, Rate::Control)?;

// Build the graph. Each `.build` appends the UGen and returns the
// handle you feed into the next one. Constants are passed unwrapped
// — the setters take `impl Into<UGenInput>`.
let osc = SinOsc::ar().freq(freq).phase(0.0).build(&mut def);
Out::ar().bus(0.0).channels_array([osc]).build(&mut def);

// `.scsyndef` bytes — send via `/d_recv` or write to disk.
let bytes = def.to_bytes()?;
# Ok::<(), scsynthdef_compiler::SynthDefError>(())
```

Round-trip a compiled binary back into a `SynthDef` for inspection:

```rust
use scsynthdef_compiler::SynthDef;

let def = SynthDef::from_bytes(&bytes)?;
let json = def.to_json()?;          // for diffs / debugging
let back = SynthDef::from_json(&json)?;
```

Introspect the bundled UGen catalogue (367 UGens shipped):

```rust
use scsynthdef_compiler::registry::{lookup_ugen, ugens_by_category};

let spec = lookup_ugen("SinOsc").unwrap();
println!("{}: {} args, {:?} outputs",
    spec.name, spec.defaults.len(), spec.num_outputs);

for (category, ugens) in ugens_by_category() {
    println!("{category}: {} ugens", ugens.len());
}
```

### From TypeScript (wasm-bindgen)

The wasm-bindgen build exports the same `SynthDef` graph builder, plus
stringly-typed `addUgen` / `addControl` methods and one generated typed
class per buildable UGen, with a static method per supported rate
(`SinOsc.ar(def, { freq })`, mirroring SuperCollider's `SinOsc.ar(...)`).

```ts
import { SynthDef, parseScgf, SinOsc } from './pkg/scsynthdef_compiler.js';
import type { UGenInput } from './pkg/scsynthdef_compiler.js';

// Helpers to build UgenInput variants for addUgen's inputs array.
const k = (v: number): UGenInput => ({ constant: v });
const u = (i: number): UGenInput => ({ ugen: i });

const def = new SynthDef('sine');

// addControl returns a UgenInput handle you can feed to addUgen.
const freq = def.addControl('freq', 440, 'control');

// addUgen(name, rate, inputs, numOutputs, specialIndex) → graph index.
// Wrap that index in `u(...)` to reference it from a later UGen.
const osc = def.addUgen('SinOsc', 'audio', [freq, k(0)], 1, 0);
def.addUgen('Out',    'audio', [k(0), u(osc)],           0, 0);

const bytes = def.toBytes();

// Inspect / diff.
const json = def.toJson();
const parsed = parseScgf(bytes);

// The typed surface delegates to the same Rust builders.
const typedOsc = SinOsc.ar(def, { freq });
```

See `examples/node/sclang_parity.ts` for the full three-fixture
harness that byte-diffs against `sclang`.

## Build targets

### Native Rust

```bash
cargo build -p scsynthdef-compiler
cargo test  -p scsynthdef-compiler
cargo run   -p scsynthdef-compiler --example sclang_parity
```

`examples/sclang_parity.rs` builds three fixtures (`sine`,
`sc_test_recorder`, `global_clock_phase`) via the typed `builders::*`
API and byte-diffs the output against `sclang`'s compiler.

### WebAssembly + TypeScript bindings

The wasm-bindgen build is generated with wasm-pack:

```bash
yarn generate:synthdef-compiler
```

`src/wasm.rs` exports the core class and helpers. `src/builders_wasm.rs`
includes `OUT_DIR/ugen_builders_wasm.rs`, which contains the generated
wasm-bindgen functions and TypeScript custom section. The package registries
do not cross the wasm boundary: `packages/synthdef-compiler/src/registry.ts`
and `env-registry.ts` import the committed specs directly.

## Regeneration

Edit `assets/specs/ugens.json` or `assets/specs/envs.json`, then build the
crate. `build.rs` deserializes the specs and re-emits registry data and macro
invocations into `OUT_DIR`; Cargo's `rerun-if-changed` tracks the JSON files.

```bash
cargo build -p scsynthdef-compiler
yarn generate:synthdef-compiler
```

The second command runs wasm-pack and commits its package output. Nothing
emitted into `OUT_DIR` is committed. `src/specs.rs`, `src/builders.rs`, and
`src/builders_wasm.rs` only include those emitted files; the builder structs
and rate factories expand through the macros in `src/ugens_macro.rs`.
