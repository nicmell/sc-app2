# @sc-app/server-commands

The app's typed OSC vocabulary for
[`scsynth`](https://doc.sccode.org/Reference/Server-Command-Reference.html) — an
abstraction/utility layer over the **wasm-bindgen build** of the vendored
`scserver-commands` Rust crate (`src-tauri/crates/scserver-commands`). One
protocol implementation shared by the Rust backend (native rlib) and the
frontend (this package), with tsify-generated TypeScript types whose
discriminant IS the OSC address: a message is a flat
`{ address: "/s_new", defName, … }` object, a decoded reply narrows on
`reply.address` — no tag↔address mapping exists anywhere.

## Layout

- `pkg/` — the wasm-pack output (24 KB glue + wasm + `.d.ts` + the
  `init.js` dual-environment loader). **Generated and committed** —
  regenerate with `yarn generate:server-commands` whenever the crate changes
  (prereqs: `rustup target add wasm32-unknown-unknown`,
  `cargo install wasm-pack`). Importing the package instantiates the wasm at
  module load: node (vitest included) feeds the bytes from disk, browsers
  fetch the Vite-emitted asset.
- `src/component.ts` — the binary boundary: `encode(msg)`,
  `encodeBundle(time, msgs)`, `decodeReply(bytes)`, `decodeReplyPacket(bytes)`
  (bundle-aware), `atUnixMs(ms)` (wall-clock → NTP `OscTimetag`). All throw
  on malformed input.
- `src/builders.ts` — `ServerMessage` builders for the commands the app
  speaks (`sNew`, `nSet`, `nSetn`, `dRecv`, `scopeSubscribe`, `dirtPlay`,
  `raw` escape hatch, …) plus the add-action constants.
- `src/describe.ts` — console-log formatting: wire-ORDER rendering of each
  shape's fields (`describeMessage`/`describeReply`, no wasm crossings) and
  `flattenEncoded(bytes)` (byte-truth for the test suites).

## Usage

```ts
import { sNew, AddToHead, encode, decodeReply } from "@sc-app/server-commands";

const bytes = encode(sNew("sine", 1001, AddToHead, 100, [["freq", 440]]));
// …send bytes over the WS transport…

const reply = decodeReply(incoming); // { address: "/n_go", nodeId, … }
if (reply.address === "/synced") console.log(reply.syncId);
```

## Notes

- The escape hatch (`raw()`) is the only shape with an `args` field — that
  marker is how both TypeScript narrowing and the wasm boundary tell raw
  messages from catalogued ones.
- `/scope/chunk` samples cross the boundary as one transferable
  `Float32Array` memcpy (the binding layer builds that arm manually — serde
  would box them into `number[]` on the ~47 Hz streaming path).
- Floats ride the wire as OSC float32 — non-dyadic values (0.2, 0.9) come
  back with float32 precision; tests compare via `Math.fround`.
- The scope protocol (`/scope/subscribe|unsubscribe|chunk`) is an sc-app
  bridge extension defined in the crate, spoken with the Rust bridge — never
  routed to scsynth.
- Tests (`yarn workspace @sc-app/server-commands test`) run the REAL wasm in
  node — the encode/decode goldens are the cross-language contract gate.
