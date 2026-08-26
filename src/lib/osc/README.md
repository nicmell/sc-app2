# OSC client and worker endpoint

OSC communication is split at a plain-data boundary. The main thread owns app
state and scsynth sequencing; the worker owns the WebSocket, binary codec, and
backend-synchronized clock estimator/tick scheduler (see docs/clock.md at the repo
root for the full sync design). Neither side exposes wire bytes across
`postMessage`.

```text
OscClient.send(OscPacket)                         main thread
        │  { type: "osc", packet }
        ▼
worker/WorkerClient.ts ───────────────────────► worker/worker.ts
                                                   │ encode
                                                   ▼
                                              WebSocket bytes

                                              WebSocket bytes
                                                   │ decode
                                                   ▼
OscClient.handleReply ◄────────────────────── worker/worker.ts
        ▲  { type: "osc", packet }
```

## Modules

| Module                   | Responsibility                                                                                                                                                                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OscClient.ts`           | Global stateful protocol owner: lifecycle events, reply waiters, worker-clock subscriptions, node and scope allocation, command sequencing, and scope-chunk dispatch. `send()` and `handleReply()` use the plain `OscPacket` / `OscMessage` model from `@sc-app/server-commands`. |
| `middleware.ts`          | Transport middleware contract and the reentrant, error-isolated command/event dispatcher. Lifecycle traffic is guaranteed to reach the terminal.                                                                                                                                  |
| `middlewares/`           | Plain logging, error-toast, and status observers plus their sole registration site. They consume worker-protocol commands/events and own their respective OSC store fields.                                                                                                       |
| `watchdog.ts`            | Heartbeat watchdog consuming the client's connected/clock seams and exposing a transport middleware that stamps `/status.reply`.                                                                                                                                                  |
| `worker/WorkerClient.ts` | Permanent main-thread worker proxy. It runs command/event middleware chains, posts plain packets, mirrors connection status, respawns a crashed worker, and synthesizes close events for orderly shutdown and worker crashes.                                                     |
| `worker/worker.ts`       | OSC worker endpoint. It encodes outgoing packets, decodes incoming frames, intercepts worker-internal `/clock/*` commands/replies, reports codec failures, and transfers inbound blob buffers. The binary codec dependency is imported only here.                                 |
| `worker/clock.ts`        | NTP-style bridge offset estimator over `Date.now()` plus monotonic absolute-phase tick streams. RTT and scheduling stay in the worker's `performance.now()` domain.                                                                                                               |
| `worker/transport.ts`    | Raw in-worker WebSocket transport. Its private events carry byte frames and never cross the worker boundary directly.                                                                                                                                                             |

## Worker protocol

Commands from `WorkerClient` are `{ type: "open", url }`, `{ type: "close" }`,
or `{ type: "osc", packet }`. Events back are `open`, `close`, `error`, `respawn`, or the
same `{ type: "osc", packet }` shape. Packets are plain messages
`{ address, args }` or bundles `{ timetag, packets }` and are structured-clone
safe.

The main-thread middleware registration order carries no correctness
dependency: each current observer calls `next` synchronously. Tx logging skips
`/clock/*`; rx logging skips scope chunks, clock tick/status, and
`/status.reply`, while `/fail` and `/late` remain both logged and toasted. A
future phase will apply the same contract inside the worker, starting by
turning worker.ts's `/clock/*` interception into worker-side middleware.

Outbound packet-shaped arguments (notably `/d_recv`'s embedded `/sync`)
become OSC blobs in the worker codec. Decode is intentionally asymmetric:
inbound blobs remain `Uint8Array` values. Bundle packets are walked on the
main thread in wire order and each message feeds `handleReply` immediately.

`/scope/*` and `/clock/*` are bridge-internal families and never route to UDP
peers. Bare clock subscribe commands are intercepted before encoding; ping/pong
uses the WebSocket so the offset estimate measures the transport that carries
scheduled OSC. Ping carries `[seq:i]`; pong carries `[seq:i, srv:d]`, with the
worker retaining the monotonic send time by sequence. Clock subscriptions continue while disconnected and are replayed
after worker respawn. `clockNow()` is wall time plus the latest estimated offset;
monotonic scheduler phase must continue to use `performance.now()`.
