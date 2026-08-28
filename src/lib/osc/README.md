# OSC client and worker endpoint

OSC communication is split at a plain-data boundary. Each client realm (the
dashboard, its box iframes, popped-out tabs) owns its app state and scsynth
sequencing; the SHARED worker (one instance per origin, a MessagePort per
client — docs/multi-tab.md) owns the one WebSocket per session, the binary
codec, the backend-synchronized clock estimator/tick scheduler (docs/clock.md),
and every allocator that must not collide across clients. Where SharedWorker
is unavailable the SAME script runs as a per-page dedicated worker. Neither
side exposes wire bytes across `postMessage`.

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

| Module                   | Responsibility                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OscClient.ts`           | Realm-local stateful protocol owner: lifecycle events, reply waiters, worker-clock subscriptions, the joined node-id CHUNK (sync `nextNodeId` + watermark refill), command sequencing, scope-chunk dispatch, and the box claim/presets RPC seam. `send()` and `handleReply()` use the plain `OscPacket` / `OscMessage` model from `@sc-app/server-commands`.                    |
| `middleware.ts`          | Transport middleware contract and the reentrant, error-isolated command/event dispatcher. Lifecycle traffic is guaranteed to reach the terminal.                                                                                                                                                                                                                                |
| `middlewares/`           | Plain logging, error-toast, and status observers plus their sole registration site. They consume worker-protocol commands/events and own their respective OSC store fields.                                                                                                                                                                                                     |
| `watchdog.ts`            | Heartbeat watchdog consuming the client's connected/clock seams and exposing a transport middleware that stamps `/status.reply`.                                                                                                                                                                                                                                                |
| `worker/WorkerClient.ts` | Main-thread proxy over a SharedWorker port (or the fallback dedicated worker). It runs command/event middleware chains, posts plain packets, mirrors this client's connection status, owns the correlated `request()` RPC seam, respawns a crashed dedicated worker, and synthesizes close events — `close()` is a LEAVE; the shared socket survives for the other members.     |
| `worker/worker.ts`       | Thin port dispatcher: attaches every SharedWorker port (or the dedicated scope itself) to the SessionHub.                                                                                                                                                                                                                                                                       |
| `worker/sessions.ts`     | The SessionHub — one Connection per session id: socket + codec + WorkerClock, join/leave membership with a grace close, the one-time session `/g_new`, chunked node-id handout, the scope-slot allocator, targeted scope/clock routing, exclusive box claims, the live presets cache, and Web-Locks death cleanup (streams stopped, slots freed, leftover plugin groups freed). |
| `worker/clock.ts`        | NTP-style bridge offset estimator over `Date.now()` plus monotonic absolute-phase tick streams. RTT and scheduling stay in the worker's `performance.now()` domain.                                                                                                                                                                                                             |
| `worker/transport.ts`    | Raw in-worker WebSocket transport. Its private events carry byte frames and never cross the worker boundary directly.                                                                                                                                                                                                                                                           |

## Worker protocol

Commands from `WorkerClient` are `{ type: "join", url, sessionId, session,
lockName? }`, `{ type: "leave" }`, `{ type: "rpc", id, req }` (allocation,
box claims, presets — correlated by id), or `{ type: "osc", packet }`. Events
back are `joined`, `open`, `close`, `error`, `respawn` (dedicated fallback
only), `rpc-reply`, `presets` (a sibling client's forwarded harvest), or the
same `{ type: "osc", packet }` shape. Packets are plain messages
`{ address, args }` or bundles `{ timetag, packets }` and are structured-clone
safe; `/scope/chunk` events are TRANSFERRED to exactly their owning port,
everything else broadcasts to every member.

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
