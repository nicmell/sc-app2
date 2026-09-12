# OSC client and worker endpoint

OSC communication is split at a plain-data boundary. The main thread owns
app state, scsynth sequencing, AND the whole clock (`OscClient`, over its
`WorkerClient` proxy); the worker-side `WorkerEndpoint` owns the binary
codec over the byte transport plus the tick-stamped session watchdog (see
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

| Module                   | Responsibility                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OscClient.ts`           | The main-thread protocol brain (global `oscClient`, composing the WorkerClient): lifecycle events, reply waiters, tick-driven clock callbacks, node and scope allocation, command sequencing, and scope-chunk dispatch. `dispatch()` and `handleReply()` use the plain `OscMessage` model from `@sc-app/server-commands`.                                                                                         |
| `middleware.ts`          | Transport middleware contract and the reentrant, error-isolated command/event dispatcher. Lifecycle traffic is guaranteed to reach the terminal.                                                                                                                                                                                                                                                                  |
| `middlewares/`           | Plain logging, error-toast, and status observers plus their sole registration site. They consume worker-protocol commands/events and own their respective OSC store fields.                                                                                                                                                                                                                                       |
| `WorkerClient.ts`        | Permanent main-thread worker proxy. It runs command/event middleware chains, posts plain packets, mirrors connection status, respawns a crashed worker, and synthesizes close events for orderly shutdown and worker crashes.                                                                                                                                                                                     |
| `../worker/endpoint.ts`  | The `WorkerEndpoint`: the binary codec + the session watchdog. It encodes/decodes over the byte transport (the `at` metadata becomes the bundle timetag; inbound bundles flatten to messages, blob buffers collected for zero-copy transfer); the global clock's `/tr` tick stamps the composed `Watchdog` and every message posts up untouched. The codec dependency is imported only here.                      |
| `../worker/transport.ts` | The byte `Transport` — ONLY the raw WebSocket: open/close/send bytes, open/frame/error/close events. No codec, no protocol.                                                                                                                                                                                                                                                                                       |
| `../worker/worker.ts`    | Web Worker entry: thin glue composing the endpoint over the worker scope.                                                                                                                                                                                                                                                                                                                                         |
| `../worker/watchdog.ts`  | The `Watchdog` — the session heartbeat on worker timers (never background-throttled, independent of the possibly-dead connection they watch): the endpoint stamps `markAlive()` on the global clock's `/tr` tick ONLY (a pong or `/status.reply` from a clock-less stack must not count), and staleness past `WATCHDOG_TIMEOUT_MS` fires `onDead` once — surfaced as a transport error, which closes the session. |
| `../clock/ClockSync.ts`  | The WHOLE app clock (composed by OscClient): it originates `/clock/ping` riding the tick metronome, completes the round-trip on the pong (one in-flight slot + min-RTT window → `now()` + the store publish), and runs the tick-driven callback registry (the metronome is the audio engine's `/tr`, id 4242 at 20 Hz), the one-way `TickTracker` (`audioNow()`/skew) and the `SlewedClock` behind `audioTime()`. |

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
`/clock/*`; rx logging skips scope chunks, clock pongs, and
`/status.reply`, while `/fail` and `/late` remain both logged and toasted.

Outbound packet-shaped arguments (notably `/d_recv`'s embedded `/sync`)
become OSC blobs in the worker codec. Decode is intentionally asymmetric:
inbound blobs remain `Uint8Array` values. Each inbound message feeds
`handleReply` directly (any wire bundle was already flattened in the
endpoint).

`/scope/*` and `/clock/*` are bridge-internal families and never route to UDP
peers. Ping/pong uses the WebSocket so the offset estimate measures the
transport that carries scheduled OSC: ping carries `[seq:i]` (one per 2 s
of ticks, originated by ClockSync on the MAIN thread and sent down the
ordinary path); pong carries `[seq:i, srv:d]` and flows back up as an
ordinary message to `handleReply` — the postMessage boundary has NO clock
vocabulary. The METRONOME is the audio engine's own `/tr` tick (the
`__global_clock__` synth, trigger id 4242 at 20 Hz — AUDIO-CLOCK.md),
routed by trigger id in `handleReply` so a plugin's own SendTrig passes
untouched. Clock callbacks fire only while connected and ticking (nothing
keeps time offline; see docs/clock.md). `clock.now()` is wall time plus the
latest estimated offset.
