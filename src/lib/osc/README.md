# OSC client and worker endpoint

OSC communication is split at a plain-data boundary. The main thread owns app
state and scsynth sequencing; the worker owns the WebSocket and binary codec.
Neither side exposes wire bytes across `postMessage`.

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

| Module                   | Responsibility                                                                                                                                                                                                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OscClient.ts`           | Global client and stateful protocol owner: connection lifecycle events, tx/rx telemetry, reply waiters, heartbeat watchdog, node and scope allocation, command sequencing, and scope-chunk dispatch. `send()` and `handleReply()` use the plain `OscPacket` / `OscMessage` model from `@sc-app/server-commands`. |
| `worker/WorkerClient.ts` | Permanent main-thread worker proxy. It posts plain packets, mirrors connection status, respawns a crashed worker, and synthesizes the single orderly close event.                                                                                                                                                |
| `worker/worker.ts`       | OSC worker endpoint. It encodes outgoing packets, decodes incoming frames, reports codec failures as error events, and transfers inbound blob buffers to the main thread. The binary codec dependency is imported only here.                                                                                     |
| `worker/transport.ts`    | Raw in-worker WebSocket transport. Its private events carry byte frames and never cross the worker boundary directly.                                                                                                                                                                                            |

## Worker protocol

Commands from `WorkerClient` are `{ type: "open", url }`, `{ type: "close" }`,
or `{ type: "osc", packet }`. Events back are `open`, `close`, `error`, or the
same `{ type: "osc", packet }` shape. Packets are plain messages
`{ address, args }` or bundles `{ timetag, packets }` and are structured-clone
safe.

Outbound packet-shaped arguments (notably `/d_recv`'s embedded `/sync`)
become OSC blobs in the worker codec. Decode is intentionally asymmetric:
inbound blobs remain `Uint8Array` values. Bundle packets are walked on the
main thread in wire order and each message feeds `handleReply` immediately.
