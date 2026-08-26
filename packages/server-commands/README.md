# @sc-app/server-commands

Typed, plain-data OSC messaging for
[`scsynth`](https://doc.sccode.org/Reference/Server-Command-Reference.html).
The primary entry provides packet types, per-address constructors, timetag
helpers, flattening, and typed reply accessors without loading a binary codec.

```ts
import { AddToHead, inFuture, sNew, type OscPacket } from "@sc-app/server-commands";

const message = sNew("sine", 1001, AddToHead, 100, { freq: 440, amp: 0.5 });
const scheduled: OscPacket = { timetag: inFuture(200), packets: [message] };
```

Messages are `{ address, args }`; bundles are `{ timetag, packets }`. Both are
plain structured-clone-safe objects. An outbound packet may itself be an
argument—used for command completion packets such as `/d_recv` + `/sync`—and
the codec encodes that nested packet as a blob. Decode leaves inbound blobs as
`Uint8Array`, so that conversion is intentionally asymmetric.

The binary API is isolated behind the `@sc-app/server-commands/codec` subpath:

```ts
import { decode, encode } from "@sc-app/server-commands/codec";

const bytes = encode(scheduled);
const packet = decode(bytes);
```

The app imports that subpath only from its OSC worker (and codec tests), keeping
the codec implementation out of the main-thread bundle.

Command constructors are grouped under `commands/` (`node`, `group`,
`synthdef`, `buffer`, `control`, `misc`, `scope`, and `clock` — the
bridge's `/clock/*` ping/pong/subscribe vocabulary). `replies.ts` provides
common address constants and positional readers; `timetag.ts` provides
`immediate`, `atDate`, `inFuture`, and `fromTick` / `tickToTimetag`.
