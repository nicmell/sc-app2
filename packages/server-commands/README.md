# @sc-app/server-commands

The app's typed OSC vocabulary for
[`scsynth`](https://doc.sccode.org/Reference/Server-Command-Reference.html) — an
abstraction/utility layer over the **wasm-bindgen build** of the vendored
`scserver-commands` Rust crate (`src-tauri/crates/scserver-commands`). One
protocol implementation shared by the Rust backend (native rlib) and the
frontend (this package), with tsify-generated TypeScript types whose
discriminant IS the OSC address: a typed message is an args-nested
`{ address: "/s_new", args: { defName, … } }` object, and a decoded reply
narrows on `reply.address` — no tag↔address mapping exists anywhere.

## Layout

- `pkg/` — the wasm-pack output (24 KB glue + wasm + `.d.ts` + the
  `init.js` dual-environment loader). **Generated and committed** —
  regenerate with `yarn generate:server-commands` whenever the spec or crate
  changes (prereqs: `rustup target add wasm32-unknown-unknown`,
  `cargo install wasm-pack`). Importing the package instantiates the wasm at
  module load: node (vitest included) feeds the bytes from disk, browsers
  fetch the Vite-emitted asset.
- `src/component.ts` — the binary boundary: `encode(msg)`,
  `encodeBundle(time, msgs)`, `decodeReply(bytes)`, `decodeReplyPacket(bytes)`
  (bundle-aware), `messageToOsc(msg)`, `decodeRawPacket(bytes)`, and
  `atUnixMs(ms)` (wall-clock → NTP `OscTimetag`). All throw on malformed input.
- `specs/server-commands.json` — all 67 typed commands, grouped by category;
  the three sc-app bridge commands live under `bridge`, and the two
  `/scope/*` commands carry `decode: true` for the bridge-side parser.
- `scripts/generate-rust.ts` — validates the local spec and emits the
  committed per-category `src/commands/*.rs` macro invocations plus `mod.rs`
  in the Rust crate. `--check` reports drift without writing.
- `src/builders.ts` — re-exports the wasm builders and adds only the add-action
  constants plus the `raw` escape hatch.
- `src/describe.ts` — console-log formatting backed by the wasm wire views:
  `describeMessage(msg)` and `flattenEncoded(bytes)`.

## Usage

```ts
import { sNew, AddToHead, encode, decodeReply } from "@sc-app/server-commands";

const bytes = encode(sNew("sine", 1001, AddToHead, 100, [["freq", 440]]));
// …send bytes over the WS transport…

const reply = decodeReply(incoming); // { address: "/n_go", args: { nodeId, … } }
if (reply.address === "/synced") console.log(reply.args.syncId);
```

## Notes

- The escape hatch (`raw()`) keeps an `args: OscArg[]` array; typed payloads
  use an `args` object, so `Array.isArray(value.args)` distinguishes raw from
  catalogued values.
- `/scope/chunk` samples cross the boundary as one transferable
  `Float32Array` memcpy (the binding layer builds that arm manually — serde
  would box them into `number[]` on the ~47 Hz streaming path).
- Floats ride the wire as OSC float32 — non-dyadic values (0.2, 0.9) come
  back with float32 precision; tests compare via `Math.fround`.
- The scope protocol (`/scope/subscribe|unsubscribe|chunk`) is an sc-app
  bridge extension in the package spec/reply catalogue, spoken with the Rust
  bridge — never routed to scsynth.
- Tests (`yarn workspace @sc-app/server-commands test`) run the REAL wasm in
  node — the encode/decode goldens are the cross-language contract gate. A
  generator test catches committed Rust drift, and the round-trip tests check
  `flattenEncoded` against `describeMessage`.

## Regeneration

Edit `specs/server-commands.json`, then regenerate the committed Rust catalogue
and wasm package:

```bash
yarn generate:server-commands
```

The command runs `scripts/generate-rust.ts` before wasm-pack. To update or
check only the committed Rust modules, run the script directly:

```bash
yarn tsx packages/server-commands/scripts/generate-rust.ts
yarn tsx packages/server-commands/scripts/generate-rust.ts --check
```

The generated command modules contain full `sc_commands!` invocations;
`commands_macro.rs` expands them into structs and encoders. `commands/prelude.rs`
is hand-written. The crate has no build script or shared spec-schema crate, so
its committed sources are self-contained.
