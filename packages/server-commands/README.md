# @sc-app/server-commands

The app's typed OSC vocabulary for
[`scsynth`](https://doc.sccode.org/Reference/Server-Command-Reference.html) — an
abstraction/utility layer over the **wasm component** transpiled from the
vendored `scserver-commands` Rust crate
(`src-tauri/crates/scserver-commands`). One protocol implementation shared by
the Rust backend (native rlib) and the frontend (this package).

## Layout

- `pkg/` — the jco-transpiled component (ESM + `scserver.core.wasm` + typed
  `.d.ts`). **Generated and committed** — regenerate with
  `yarn generate:server-commands` whenever the crate or its WIT changes
  (prereqs: `rustup target add wasm32-unknown-unknown`,
  `cargo install cargo-component`). Importing the package instantiates the
  wasm via top-level await (node loads it through fs — vitest included;
  browsers fetch-compile the Vite-emitted asset).
- `src/component.ts` — the binary boundary: `encode(msg)`,
  `encodeBundle(time, msgs)`, `decodeReply(bytes)`, `decodeReplyPacket(bytes)`
  (bundle-aware), `atUnixMs(ms)` (wall-clock → NTP `OscTime`). All throw on
  malformed input.
- `src/builders.ts` — `ServerMessage` builders for the commands the app
  speaks (`sNew`, `nSet`, `nSetn`, `dRecv`, `scopeSubscribe`, `dirtPlay`,
  `raw` escape hatch, …) plus the add-action constants. Values are the WIT
  variant encoding: `{ tag, val }` plain JSON.
- `src/scope.ts` — `DecodedScopeChunk` + `toScopeChunk` (the widget shape;
  the big-endian blob codec lives in the crate).
- `src/describe.ts` — console-log formatting: `flattenEncoded(bytes)` (wire
  truth for outbound logging/assertions), `describeReply(reply)`,
  `formatOscArg`.

## Usage

```ts
import { sNew, AddToHead, encode, decodeReply } from "@sc-app/server-commands";

const bytes = encode(sNew("sine", 1001, AddToHead, 100, [["freq", 440]]));
// …send bytes over the WS transport…

const reply = decodeReply(incoming); // { tag: "n-go", val: { nodeId, … } }
if (reply.tag === "synced") console.log(reply.val.syncId);
```

Everything inbound classifies into the typed `ServerReply` union (the crate's
parser): `n-go`, `synced`, `fail`, `status-reply`, `scope-chunk`
(`samples` lifts as a transferable `Float32Array`), … with `other` as the
raw fallback.

## Notes

- Floats ride the wire as OSC float32 — non-dyadic values (0.2, 0.9) come
  back with float32 precision; tests compare via `Math.fround`.
- The scope protocol (`/scope/subscribe|unsubscribe|chunk`) is an sc-app
  bridge extension defined in the crate, spoken with the Rust bridge — never
  routed to scsynth.
- Tests (`yarn workspace @sc-app/server-commands test`) run the REAL wasm in
  node — the encode/decode goldens are the cross-language contract gate.
