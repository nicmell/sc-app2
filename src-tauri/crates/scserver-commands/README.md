# scserver-commands

Typed Rust encoders and parsers for the [SuperCollider server command
protocol](https://doc.sccode.org/Reference/Server-Command-Reference.html)
— the OSC messages scsynth accepts at runtime, the replies it sends
back, and the NRT (non-realtime) score file format.

## Layers

- **`commands::*`** — one typed struct per command (`SNew`, `NFree`,
  `BAlloc`, …). Required args in the constructor, optional trailing
  args editable via struct update:
  ```rust
  BAlloc { num_channels: Some(2), ..BAlloc::new(0, 8192) }.encode()?;
  ```
- **`ServerMessage`** — tagged union over every known command (61
  payload variants + 6 argless unit cases + an `Other { address, args }`
  escape hatch). Construct via `From<Cmd>` or directly:
  ```rust
  let msg: ServerMessage = BAlloc::new(0, 8192).into();
  let bytes = msg.encode()?;        // OSC wire bytes
  ServerMessage::Status.encode()?;  // unit variant
  ```
- **`commands::{ControlId, NumericValue, ControlValue}`** — the three
  polymorphic OSC arg shapes the SC protocol uses. Each has ergonomic
  `From` impls: `"freq".into()` → `ControlId::Name`, `440.0f32.into()`
  → `ControlValue::Float`.
- **`OscMessage`** — one raw OSC wire message (address + typed args).
  The low-level shape every command encodes into.
  `encode() -> Vec<u8>` via [`rosc`](https://docs.rs/rosc);
  `decode(&[u8])` is the inverse.
- **`ServerReply`** — tagged enum over every documented reply
  (`/done`, `/fail`, `/n_go`, `/status.reply`, `/tr`, …).
  `ServerReply::decode(&[u8])` dispatches on the incoming address.
- **`NrtScore`** — timestamped OSC bundles, serialised to the
  length-prefixed binary file scsynth's `-N` mode consumes.

## Usage

### From Rust

Encode a command, decode a reply, build an NRT score:

```rust
use scserver_commands::{NrtScore, ServerMessage, ServerReply};
use scserver_commands::commands::{NFree, SNew};

// 1. Encode a /s_new with two control pairs.
let msg: ServerMessage = SNew::new(
    "sine".into(),
    1001,   // new node id
    0,      // add action = head
    1,      // target group
    vec![
        ("freq".into(), 440.0f32.into()),
        ("amp".into(),   0.5f32.into()),
    ],
).into();
let bytes: Vec<u8> = msg.encode()?;
// … send `bytes` to scsynth over UDP …

// 2. Decode an incoming reply — typed variant dispatch.
match ServerReply::decode(&reply_bytes)? {
    ServerReply::StatusReply(s) =>
        println!("{} ugens, {} synths", s.num_ugens, s.num_synths),
    ServerReply::NGo(n) =>
        println!("node {} started in group {}", n.node_id, n.parent_id),
    ServerReply::Fail { address, error, .. } =>
        eprintln!("fail {address}: {error}"),
    _ => {}
}

// 3. Assemble an NRT score — feed typed commands into timestamped
//    bundles, serialise to the scsynth `-N` file format.
let score = NrtScore::new()
    .at(0.0, ServerMessage::from(SNew::new(
        "sine".into(), 1001, 0, 1, vec![],
    )).to_osc_message())
    .at(2.0, ServerMessage::from(NFree::new(vec![1001])).to_osc_message());
let nrt_bytes = score.encode()?;
# Ok::<(), scserver_commands::CommandError>(())
```

Required args go in `new(...)`; optional trailing args use struct-update:

```rust
use scserver_commands::commands::BAlloc;

let bytes = BAlloc {
    num_channels: Some(2),
    ..BAlloc::new(0, 8192)
}.encode()?;
```

### From TypeScript (wasm-bindgen)

Encode commands and decode replies through the wasm-bindgen/tsify bindings:

```ts
import {
  at_unix_ms,
  decode_reply,
  encode,
  encode_bundle,
} from './pkg/scserver_commands.js';

// 1. Encode a /s_new command.
const message = {
  address: '/s_new' as const,
  defName: 'sine',
  nodeId: 1001,
  addAction: 0,
  targetId: 1,
  tail: [
    [{ name: 'freq' }, { float: 440 }],
    [{ name: 'amp' }, { float: 0.5 }],
  ],
};
const bytes = encode(message);

// 2. Encode an atomic OSC bundle.
const bundle = encode_bundle(at_unix_ms(Date.now()), [message]);

// 3. Decode a reply — the address discriminates the union.
const reply = decode_reply(replyBytes);
switch (reply.address) {
  case '/status.reply':
    console.log(reply.numUgens, reply.numSynths);
    break;
  case '/n_go':
    console.log(reply.nodeId, reply.parentId);
    break;
  case '/fail':
    console.error(reply.command, reply.error);
    break;
}
```

Addresses outside the catalogue go through `OtherMsg`:

```ts
encode({
  address: '/my-plugin-cmd',
  args: [{ int32: 1 }],
});
```

## Source of truth

`assets/specs/server-commands.json` is the source of truth for the standard
SC command surface. `build.rs` emits one `sc_commands!` invocation and the
`KnownMessage` callback list into `OUT_DIR`; `src/commands_macro.rs` expands
the structs, encoders, and address-tagged enum. `/dirt/play` is a typed
`DirtPlay { pairs }`, and it and `/scope/subscribe` and `/scope/unsubscribe`
remain hand-written `sc_commands!` invocations in `src/commands.rs` because
they are bridge extensions. Replies remain hand-written in `src/replies.rs`.

## Build targets

Native Rust + tests:

```bash
cargo build -p scserver-commands
cargo test  -p scserver-commands
```

WebAssembly + TS bindings:

```bash
cd crates/scserver-commands
wasm-pack build --release --target web -- --features wasm
```

## Wasm surface

The wasm-bindgen layer exports `encode`, `encode_bundle`, `decode_reply`,
`decode_reply_packet`, and `at_unix_ms`. tsify emits the address-tagged
`KnownMessage` and `KnownReply` unions; `OtherMsg` is the raw-message escape
hatch. NRT score construction remains available through the native Rust API.

The generated TS `.d.ts` exposes `ServerMessage` and `ServerReply` as
symmetric discriminated unions:

```ts
export type ServerMessage =
  | BAlloc                    // { address: '/b_alloc', ... }
  | SNew                      // { address: '/s_new', ... }
  | Status                    // { address: '/status' }
  | OtherMsg                  // { address, args }
  | ...;
export function encode(msg: ServerMessage): Uint8Array;
```

The package wrapper in `packages/server-commands` exposes the generated wasm
through its typed builders and encode/decode helpers.
