# @sc-app/server-commands

The app's typed OSC command and reply boundary for
[`scsynth`](https://doc.sccode.org/Reference/Server-Command-Reference.html),
backed by the wasm build of `src-tauri/crates/scserver-commands`.

## Layout

- `specs/server-commands.json` is the source spec: 67 commands in 10
  categories, including decode flags and optional-scalar `default` values,
  plus 15 reply entries.
- `scripts/generate-rust.ts` validates that spec and emits the committed,
  rustfmt-canonicalized Rust registries: 10 category modules, `commands/mod.rs`,
  `commands/wasm_gen.rs`, and `replies/mod.rs`. `--check` detects drift and the
  package tests also reject stray generated files.
- `pkg/` is committed wasm-pack output. `yarn generate:server-commands` runs
  the generator before wasm-pack.
- `src/component.ts` initializes wasm and exposes bundle framing, reply
  decoding, raw packet decoding, and Unix-ms-to-NTP conversion.
- `src/builders.ts` re-exports the generated command builders and adds the
  add-action constants plus `raw()`.
- `src/describe.ts` contains only `FlatMessage`, `formatOscArg`, and
  `flattenEncoded` for rendering actual wire bytes through `decodeRawPacket`.
- `src/index.ts` is the package re-export shell.

## Usage

```ts
import { AddToHead, atUnixMs, decodeReply, encodeBundle, raw, sNew } from "@sc-app/server-commands";

// Construction and OSC encoding are fused into one wasm boundary crossing.
const command = sNew("sine", 1001, AddToHead, 100, [["freq", 440]]);
const packet = encodeBundle(atUnixMs(Date.now()), [command]);

// The escape hatch also returns wire bytes.
const extension = raw("/my-plugin-cmd", 1, "value");

// Replies cross as typed, adjacently tagged values.
const reply = decodeReply(incoming);
if (reply.address === "/synced") console.log(reply.args.syncId);
```

Every command builder returns `Uint8Array`; no command-shaped JS value exists.
`encodeBundle` only frames pre-encoded elements. `raw()` (backed by the wasm
`raw_bytes` export) is the escape hatch for addresses outside the spec.

Replies decode to `{ address, args }` values. The generated reply registry
contains the regular newtype variants and routes its two bespoke layouts to
hand-written implementations: `/scope/chunk` and the recursive
`/g_queryTree.reply`. Scope samples cross as a transferable `Float32Array`.
Both console transmit and receive formatting should call `flattenEncoded` on
the bytes actually sent or received.

## Regeneration

After editing the spec, run:

```bash
yarn generate:server-commands
```

To generate or check only the committed Rust registries:

```bash
yarn tsx packages/server-commands/scripts/generate-rust.ts
yarn tsx packages/server-commands/scripts/generate-rust.ts --check
```

The crate has no build script; committed registries make native builds
self-contained. Package tests run the real wasm and check generator drift,
stray files, wire round trips, and `flattenEncoded` output.
