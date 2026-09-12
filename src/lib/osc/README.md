# OSC client and worker endpoint

OSC communication is split at a plain-data boundary. The main thread owns
app state and scsynth sequencing (`OscClient`, over its `WorkerClient`
proxy); the worker-side `WorkerEndpoint` owns the binary codec over the
byte transport and composes the bridge clock's worker half (see
docs/clock.md at the repo root for the full sync design). Neither side
exposes wire bytes across `postMessage`.

```text
oscClient.dispatch(OscMessage)                       main thread
        │  { type: "osc", packet }
        ▼
WorkerClient.ts ─────────────────────────────────► ../worker/endpoint.ts
                                                      │ encode (endpoint.ts)
                                                      ▼
                                                 WebSocket bytes

                                                 WebSocket bytes
                                                      │ decode (endpoint.ts)
                                                      ▼
oscClient.handleReply ◄─────────────────────────── ../worker/endpoint.ts
        ▲  { type: "osc", packet }
```

## Modules

| Module                   | Responsibility                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OscClient.ts`           | The main-thread protocol brain (global `oscClient`, composing the WorkerClient): lifecycle events, reply waiters, sample-driven clock callbacks, node and scope allocation, command sequencing, and scope-chunk dispatch. `dispatch()` and `handleReply()` use the plain `OscMessage` model from `@sc-app/server-commands`.                                                                |
| `middleware.ts`          | Transport middleware contract and the reentrant, error-isolated command/event dispatcher. Lifecycle traffic is guaranteed to reach the terminal.                                                                                                                                                                                                                                           |
| `middlewares/`           | Plain logging, error-toast, and status observers plus their sole registration site. They consume worker-protocol commands/events and own their respective OSC store fields.                                                                                                                                                                                                                |
| `WorkerClient.ts`        | Permanent main-thread worker proxy. It runs command/event middleware chains, posts plain packets, mirrors connection status, respawns a crashed worker, and synthesizes close events for orderly shutdown and worker crashes.                                                                                                                                                              |
| `../worker/endpoint.ts`  | The `WorkerEndpoint`: the binary codec + protocol routing. It encodes/decodes over the byte transport (the `at` metadata becomes the bundle timetag; inbound bundles flatten to messages, blob buffers collected for zero-copy transfer), composes the WorkerClock (pong consumed into `/clock/sample`, `/status.reply` feeding the watchdog). The codec dependency is imported only here. |
| `../worker/transport.ts` | The byte `Transport` — ONLY the raw WebSocket: open/close/send bytes, open/frame/error/close events. No codec, no protocol.                                                                                                                                                                                                                                                                |
| `../worker/worker.ts`    | Web Worker entry: thin glue composing the endpoint over the worker scope.                                                                                                                                                                                                                                                                                                                  |
| `../worker/clock.ts`     | The `WorkerClock` — the bridge clock's worker half: the uniform 50 ms ping loop and pending map beside the socket, posting ONE raw `/clock/sample` per accepted pong (RTT stays in the worker's `performance.now()` domain), plus the heartbeat watchdog on worker timers (stale inbound traffic → onDead, surfaced as a transport error; the pong deliberately does not count).           |
| `../clock/ClockSync.ts`  | The clock's FILTERING half, on the main thread (composed by OscClient): the min-RTT sample window, `now()`, the throttled store publish, and the sample-driven callback registry (purely local — callbacks fire only while samples flow; the estimate survives a worker respawn).                                                                                                          |

## Worker protocol

Commands from `WorkerClient` are `{ type: "open", url }`, `{ type: "close" }`,
or `{ type: "osc", packet, at? }`. Events back are `open`, `close`, `error`,
`respawn`, or `{ type: "osc", packet }`. Packets are plain MESSAGES
`{ address, args }` only — structured-clone safe, never bundles: outbound
scheduling rides the `at` metadata (a bridge-time Unix-ms timetag the
endpoint wraps into the OSC bundle at encode time), and inbound bundles are
flattened to messages in wire order before posting up.

The main-thread middleware registration order carries no correctness
dependency: each current observer calls `next` synchronously. Tx logging skips
`/clock/*`; rx logging skips scope chunks, clock samples, and
`/status.reply`, while `/fail` and `/late` remain both logged and toasted.

Outbound packet-shaped arguments (notably `/d_recv`'s embedded `/sync`)
become OSC blobs in the worker codec. Decode is intentionally asymmetric:
inbound blobs remain `Uint8Array` values. Each inbound message feeds
`handleReply` directly (any wire bundle was already flattened in the
endpoint).

`/scope/*` and `/clock/*` are bridge-internal families and never route to UDP
peers. Ping/pong uses the WebSocket so the offset estimate measures the
transport that carries scheduled OSC: ping carries `[seq:i]` every 50 ms
while the socket is open; pong carries `[seq:i, srv:d]`, with the worker
retaining the monotonic send time by sequence. The per-pong `/clock/sample`
is both the measurement and the main thread's metronome — clock callbacks
fire only while connected (nothing keeps time offline; see docs/clock.md).
`clockNow()` is wall time plus the latest estimated offset.
