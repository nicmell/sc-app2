# scserver-commands

Typed Rust encoders and parsers for the
[SuperCollider server command protocol](https://doc.sccode.org/Reference/Server-Command-Reference.html),
including NRT score files and wasm bindings used by
`@sc-app/server-commands`.

## Source layout

`packages/server-commands/specs/server-commands.json` defines 67 commands in
10 categories and 15 replies. The package generator emits committed,
rustfmt-canonicalized registries and supports `--check`:

- `src/commands/`: hand-written `prelude.rs` (polymorphic enums, constants,
  `OtherMsg`, and `ServerMessage`) and `wasm.rs` coercers; 10 generated
  category files plus generated `mod.rs` and `wasm_gen.rs`.
- `src/replies/`: generated `mod.rs`, with `custom.rs` providing typed
  `take_*` accessors plus the bespoke `ScopeChunkReply` and recursive
  `QueryTreeReply` implementations used by generated dispatch arms.
- Hand-written `commands_macro.rs`, `args.rs`, `osc.rs`, `error.rs`, `nrt.rs`,
  and crate-level `wasm.rs`.

The generated reply newtypes are `Done(DoneReply)`, `Fail(FailReply)`,
`Late(LateReply)`, `NGo` through `NInfo` over shared `NodeInfo`,
`StatusReply`, `Tr(TrReply)`, `BSetn(BSetnReply)`, and
`Synced(SyncedReply)`, followed by the two custom variants.

## Native Rust

```rust
use scserver_commands::commands::{NFree, SNew};
use scserver_commands::{KnownReply, NrtScore, ServerMessage, ServerReply};

let command: ServerMessage = SNew::new(
    "sine".into(),
    1001,
    0,
    1,
    vec![("freq".into(), 440.0f32.into())],
).into();
let bytes = command.encode()?;

match ServerReply::decode(&reply_bytes)? {
    ServerReply::Known(KnownReply::StatusReply(reply)) => {
        println!("{} ugens", reply.num_ugens);
    }
    ServerReply::Known(KnownReply::Fail(reply)) => {
        eprintln!("{}: {}", reply.command, reply.error);
    }
    _ => {}
}

let score = NrtScore::new()
    .at(0.0, ServerMessage::from(SNew::new(
        "sine".into(), 1001, 0, 1, vec![],
    )).to_osc_message())
    .at(2.0, ServerMessage::from(NFree::new(vec![1001])).to_osc_message());
let nrt_bytes = score.encode()?;
# Ok::<(), scserver_commands::CommandError>(())
```

Required command fields are constructor parameters. Optional trailing scalars
use their spec `default` values and can be overridden with struct update
syntax. `OscMessage` is the low-level address-plus-args representation, and
`ServerMessage::Other(OtherMsg { … })` is the native raw escape hatch.

## WebAssembly boundary

Generated wasm command builders return OSC wire bytes (`Uint8Array`) directly:
construction and encoding are fused into one boundary crossing. No
command-shaped JS value, general `encode`, parser, or message-to-OSC conversion
is exported. `raw_bytes` provides the raw escape hatch, and `encode_bundle`
frames already-encoded elements.

Replies cross as typed, adjacently tagged `{ address, args }` values.
`/scope/chunk` samples are lifted into a transferable `Float32Array`;
`decode_raw_packet` supplies the wire-truth view used to render both transmitted
and received console packets.

## Regeneration and tests

From the repository root:

```bash
yarn generate:server-commands
yarn tsx packages/server-commands/scripts/generate-rust.ts --check
cargo test -p scserver-commands --manifest-path src-tauri/Cargo.toml
```

The yarn generation command runs the TypeScript generator before wasm-pack.
The package Vitest suite checks drift and stray committed registry files. The
crate has no build script.
