# OSC client and worker endpoint

OSC communication is split at a plain-data boundary. The main thread owns app
state and scsynth sequencing; the worker owns the WebSocket, binary codec, and
backend-synchronized clock estimator/tick scheduler (see docs/clock.md at the repo
root for the full sync design). Neither side exposes wire bytes across
`postMessage`. The worker is SHARED: one instance per origin serves every
same-origin client (tabs today, plugin iframes next), each over its own
MessagePort speaking the UNCHANGED single-client protocol — the shared
endpoint (endpoint.ts) reinterprets it per port (open = join, close = leave,
id spaces NAT-translated). Where SharedWorker is unavailable the SAME script
runs as the classic per-page dedicated worker.

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

| Module                   | Responsibility                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OscClient.ts`           | Global stateful protocol owner: lifecycle events, reply waiters, typed worker-clock subscriptions, node and scope allocation, command sequencing, and scope-chunk dispatch. `send()` and `handleReply()` use the plain `OscPacket` / `OscMessage` model from `@sc-app/server-commands`.                                                                                                                                  |
| `middleware.ts`          | Transport middleware contract and the reentrant, error-isolated command/event dispatcher. Lifecycle traffic is guaranteed to reach the terminal.                                                                                                                                                                                                                                                                         |
| `middlewares/`           | Plain logging, error-toast, and status observers plus their sole registration site. They consume worker-protocol commands/events and own their respective OSC store fields.                                                                                                                                                                                                                                              |
| `watchdog.ts`            | Heartbeat watchdog consuming the client's connected/clock seams and exposing a transport middleware that stamps `/status.reply`.                                                                                                                                                                                                                                                                                         |
| `worker/WorkerClient.ts` | Main-thread proxy over a SharedWorker port (or the fallback dedicated worker — same script). It runs command/event middleware chains, posts plain packets, mirrors THIS client's connection status, synthesizes close events (close = leave; the shared socket survives for other clients), sends the once-per-port `attach` liveness lock, closes on pagehide, and respawns a crashed dedicated worker.                 |
| `worker/worker.ts`       | Thin dual-mode entry: wires every SharedWorker port (or the dedicated scope itself) onto the shared endpoint.                                                                                                                                                                                                                                                                                                            |
| `worker/endpoint.ts`     | The shared endpoint: one WebSocket + one clock, N ports. Open-as-join (late joiners get the missed `open` replayed), close-as-leave (last port closes the socket), scope-subId NAT with targeted chunk routing (keeps the zero-copy transfer single-consumer), per-port clock streams, and the `attach` death waiter (Web Locks). Encodes/decodes beside the socket — the codec dependency is imported only worker-side. |
| `worker/clock.ts`        | NTP-style bridge offset estimator over `Date.now()` plus monotonic absolute-phase tick streams. RTT and scheduling stay in the worker's `performance.now()` domain.                                                                                                                                                                                                                                                      |
| `worker/transport.ts`    | Raw in-worker WebSocket transport. Its private events carry byte frames and never cross the worker boundary directly.                                                                                                                                                                                                                                                                                                    |

## Worker protocol

Commands from `WorkerClient` are `{ type: "attach", lockName }` (once per
port — the Web Lock the client holds until its document dies; its release is
the endpoint's crash-death signal), `{ type: "open", url }`,
`{ type: "close" }`, `{ type: "osc", packet }`, or the typed clock service
(`{ type: "clock-subscribe", id, intervalMs }` / `{ type:
"clock-unsubscribe", id }` — port-local ids, never OSC, never the wire).
Events back are `open`, `close`, `error`, `respawn` (dedicated fallback
only), `{ type: "clock-tick", id, n }` (to its subscriber only), `{ type:
"clock-status", offset, rtt }`, or the same `{ type: "osc", packet }` shape. Packets are plain messages
`{ address, args }` or bundles `{ timetag, packets }` and are structured-clone
safe. Per port the semantics are exactly the old single-client contract; the
sharing (join/leave, NAT) is invisible above the endpoint.

The main-thread middleware registration order carries no correctness
dependency: each current observer calls `next` synchronously. The log carries
only `osc` frames (clock traffic is typed protocol, structurally unlogged);
rx logging skips scope chunks and `/status.reply`, while `/fail` and `/late`
remain both logged and toasted.

Outbound packet-shaped arguments (notably `/d_recv`'s embedded `/sync`)
become OSC blobs in the worker codec. Decode is intentionally asymmetric:
inbound blobs remain `Uint8Array` values. Bundle packets are walked on the
main thread in wire order and each message feeds `handleReply` immediately.

`/scope/*` and `/clock/*` are bridge-internal families and never route to UDP
peers. Clock subscriptions are typed protocol (never encoded); ping/pong
uses the WebSocket so the offset estimate measures the transport that carries
scheduled OSC. Ping carries `[seq:i]`; pong carries `[seq:i, srv:d]`, with the
worker retaining the monotonic send time by sequence. Clock subscriptions continue while disconnected and are replayed
after worker respawn. `clockNow()` is wall time plus the latest estimated offset;
monotonic scheduler phase must continue to use `performance.now()`.
