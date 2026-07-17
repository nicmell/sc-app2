# OSC architecture

The OSC engine lives entirely in a dedicated Web Worker. The main thread owns only UI-facing
bookkeeping and a typed asynchronous proxy; importing the singleton does not spawn a worker.

```
OscClientProxy.ts                 main thread: store views, RPC pending map, scope slots/subscribers
  ↕ protocol/port.ts (message unions derived in types/osc.d.ts)
worker/endpoint.ts               protocol composition root and test seam
  → worker/OscClient.ts          encode/decode, reply waiters, node ids, commands, watchdog, telemetry
  → worker/transport.ts          raw WebSocket
worker/worker.ts                 production DedicatedWorkerGlobalScope entry
```

## Protocol

`src/types/osc.d.ts` DERIVES the discriminated `OscRequest`, `OscCommand`, and `OscEvent` unions
from the worker OscClient's own method signatures and its `OscClientEvents` interface — a message
is just `{type: <method>, args}` (requests add the proxy-minted correlation id), so adding one is
exactly one worker method/event plus one proxy method. The proxy's generic `request()`/`command()`
and the endpoint's generic apply are the whole transport; `ProtocolPort` hides the minor API
difference between `Worker` and its global scope. The one transfer list (the scope chunk's sample
buffer) lives at the endpoint's single scopeChunk post site.

Awaited operations (`connect`, group/synth creation, synthdef installation) use request/reply RPC.
Control and teardown operations are FIFO fire-and-forget commands. `connect` resolves only after
the worker opens the socket and sends the session `/g_new`; the proxy then arms its local session
group and scope allocator and publishes `connected`.

## Responsibility boundary

The worker client owns packet encoding/decoding — through `@sc-app/server-commands`' wasm
component: typed `ServerMessage` values out (`send`/`sendBundle`), typed `ServerReply` values in
(`decodeReplyPacket` splits bundles) — plus flattened tx/rx logging, FIFO `once(tag, match)`
waiters keyed by reply tag, node-id allocation, sequenced acknowledgements, and the status
watchdog. Scope chunks arrive pre-decoded (`scope-chunk` replies; the BE-float blob codec lives
in the crate). It never imports `appStore`; instead it emits raw log, banner, status, close, and
scope events. Logs are batched once per microtask burst.

The proxy owns the OSC store slice, bounded log/error collections, banner coalescing, connection
bookkeeping, scope-slot allocation, and scope callbacks. Worker creation is lazy on the first
`connect`; a worker crash rejects every RPC, disconnects the store, emits `error`, and permits a
fresh worker on the next operation.

## Tests

Happy DOM has no real worker. `utils/test/loopback.ts` supplies a synchronous pair of
`ProtocolPort`s; shared setup attaches the singleton proxy to one end and calls
`createOscEndpoint` on the other. Element suites spy on the returned worker-side `OscClient` to
record packets and feed acknowledgements through `handleReply`, while allocator assertions remain
on the proxy. Synchronous delivery deliberately preserves gesture-to-send assertions.
