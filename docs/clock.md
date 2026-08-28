# Bridge clock synchronization & the global scheduler

How the app keeps ONE timebase across the webview, the OSC worker, the Rust
bridge, and scsynth — and why the scheduler lives in the Web Worker. Companion
to `scope.md` (the other bridge-internal protocol family).

## 1. The problem

Two distinct problems share one solution:

1. **Background throttling.** Strudel's pattern scheduler (Cyclist → zyklus)
   ticks on `setInterval`. On the main thread, WKWebView (Tauri) and Chrome
   throttle DOM timers to ≥1 s when the window is occluded — ticks arrive too
   late for the ~200 ms scheduling lookahead and events drop or bunch. Web
   Worker timers are exempt, so anything that must keep time in the background
   has to tick in the worker.
2. **A shared timebase.** Outgoing OSC bundles carry NTP timetags that scsynth
   executes sample-accurately against _its_ host clock. As long as the webview
   runs on the same machine, `Date.now()` agrees with that clock; a remote
   browser session (the `serve` mode over a network) does not. The app needs
   "bridge time" — the clock of the machine running the bridge and scsynth —
   available everywhere timetags are stamped.

## 2. Protocol

Only ping/pong are OSC — the one part of the clock that actually crosses the
wire. Like `/scope/*`, the `/clock/*` family is **bridge-internal**: the WS
pump intercepts it before peer routing (`src-tauri/src/core/router/ws.rs`),
and the strudel/scsynth peer regexes never match it. The wire vocabulary
lives in `packages/server-commands/src/commands/clock.ts` ⇄
`src-tauri/src/core/clock.rs` (the exact `/clock/pong` wire bytes are pinned
byte-for-byte in both languages' test suites). Everything else — subscribe/
unsubscribe/tick/status — is TYPED worker protocol, not OSC (below).

### Worker ⇄ bridge (over the session WebSocket)

```
→ /clock/ping  seq:i          sent by the worker
← /clock/pong  seq:i  srv:d   srv = bridge SystemTime, UNIX ms as f64
```

The ping is _stateful_, not echo-based: the worker records `seq → t0`
(`performance.now()` at send) in a pending map, so no timestamp needs a
round-trip and the only double on the wire is Rust-encoded (osc-js decodes
type `d` natively — the TS codec never needs to encode one). Stale or unknown
seqs are ignored; the map clears on socket open/close. The bridge captures
`srv` _before_ replying (ahead of any await, so send backpressure can't bias
the timestamp) and answers inline on the same socket.

### Webview ⇄ worker (typed transport messages — src/types/osc.d.ts)

```
↓ { type: "clock-subscribe",   id, intervalMs }   start a tick stream
↓ { type: "clock-unsubscribe", id }
↑ { type: "clock-tick",   id, n }                 one tick of stream `id`
↑ { type: "clock-status", offset, rtt }           current estimate, for clockNow()
```

First-class protocol, never OSC and never the WebSocket: the shared endpoint
(`worker/endpoint.ts`) keys each PORT's streams by its own ids (nothing to
collide across clients) and consumes `/clock/pong` beside the socket.
`OscClient.handleTransportEvent` routes ticks/status as typed cases; the OSC
console log never sees them structurally (it logs only `osc` frames).

## 3. Clock domains (the load-bearing rules)

Three clocks are in play; mixing them wrongly is the classic bug in this kind
of code:

| clock                         | property                                      | used for                                       |
| ----------------------------- | --------------------------------------------- | ---------------------------------------------- |
| worker `performance.now()`    | monotonic, sub-ms, context-local              | RTT measurement, tick phase                    |
| `Date.now()`                  | shared across window/worker, steppable, ~1 ms | carrying the offset across the thread boundary |
| bridge `SystemTime` (UNIX ms) | scsynth's host clock                          | the target domain — timetags                   |

- **RTT** is measured entirely in the worker's monotonic domain:
  `rtt = performance.now()@pong − t0`.
- **Offset** is expressed over `Date.now()` because `performance.timeOrigin`
  differs per context and must never cross the postMessage boundary:
  `offset = srv + rtt/2 − Date.now()@pong`. Main thread:
  `clockNow() = Date.now() + offset`.
- **Tick phase** is scheduled on the worker's monotonic clock (absolute
  phase: tick _n_ fires at `phase0 + n·interval`, each timeout computed
  fresh) — a wall-clock step can never stall or burst the streams.

In Tauri, bridge and webview share the host clock, so `offset ≈ 0 ± rtt/2` —
that is also the explicit degraded mode (before the first pong, and while
disconnected the estimate resets to 0). The estimator earns its keep when the
browser and bridge are different machines.

## 4. The estimator (`src/lib/osc/worker/clock.ts`)

On every socket open: reset the window, then one chained ping loop — the first
`CLOCK_PING_BURST_COUNT` (5) pings at `CLOCK_PING_BURST_INTERVAL_MS` (150 ms)
for a fast first lock, then the steady `CLOCK_PING_INTERVAL_MS` (2 s) cadence.
Every accepted pong pushes `{rtt, offset}` into a ring of
`CLOCK_SAMPLE_WINDOW` (8) samples, and the exported estimate is simply the
**minimum-RTT sample's offset** — NTP's clock-filter insight: queueing delay
only ever _adds_ to RTT, so the fastest exchange carries the least-biased
offset. No smoothing/slew: consumers convert domains only at stamp time (§6),
so an estimate change merely shifts not-yet-stamped events.

Each `CLOCK_*` constant carries its own rationale where it is defined
(`src/constants/osc.ts`, the "bridge clock" block) — burst size/spacing,
steady cadence sized for crystal drift, the 8-sample NTP clock-filter
window, and the derived watchdog cadence.

## 5. The tick scheduler

`WorkerClock.subscribe(intervalMs, onTick)` starts an absolute-phase stream:
the worker stores `phase0 = performance.now()` and schedules each tick with
`setTimeout(max(0, phase0 + n·interval − now))` — drift from a late callback
never accumulates (the next deadline is computed from the _phase_, not from
"now + interval"). The endpoint posts each tick up as a typed `clock-tick`
event to its subscribing port; the main thread (`OscClient.clockSubs`)
dispatches to the subscriber callback.

Lifecycle: streams are independent of the WebSocket — they keep ticking while
disconnected (Strudel plays offline) and across reconnects. A crashed worker
is respawned by the WorkerClient, which emits a `respawn` transport event;
`OscClient` replays every live subscription into the fresh worker (tick phase
restarts — fine for a crash path, consumers only rely on the cadence).

## 6. Consumers

**Strudel (`src/sc-elements/widgets/sc-strudel`).** Two independent hooks:

1. _Scheduling_: per-element `setInterval`/`clearInterval` shims over
   `oscClient.subscribeClock` are injected into `StrudelMirror` (forwarded to
   `repl()` → `Cyclist` → zyklus), so the pattern scheduler ticks on worker
   timers — immune to background throttling. `getTime` stays
   `performance.now()/1000`: **monotonic-local, deliberately NOT bridge
   time** — an offset step entering Cyclist's phase math would stall (backward)
   or drop haps (forward). Cleanup is structural:
   `disconnectedCallback → mirror.stop() → Cyclist.stop() → clearInterval`.
2. _Stamping_: domains convert only at the moment a `/dirt/play` bundle is
   stamped —
   `timetag = round(clockNow() + targetTimeSecs·1000 − performance.now() + SAFETY_LOOKAHEAD_MS)`.
   At offset 0 this degrades to exactly the pre-sync expression. The timetag
   is correct because scsynth shares the bridge host clock.

**Heartbeat watchdog (`lib/osc/watchdog.ts`).** The standalone observer consumes
OscClient's public seams; a 1 s clock subscription (armed on the connected
rising edge) checks `performance.now() − lastStatusAt > STATUS_REPLY_TIMEOUT_MS`
and closes the connection when scsynth's `/status.reply` heartbeats stop —
running on worker ticks, it fires on time even in a backgrounded window (a
main-thread timer would detect late), and it doubles as the recovery path
when a worker crash silently kills the socket.

**Layout autosave (`SessionManager`).** The 10 s layout `PUT` rides a clock
subscription instead of `setInterval` — same behavior, unthrottled.

**Diagnostics.** Every `clock-status` event lands in the osc store slice
(`useClockStatus()` → `{offset, rtt}`), so a broken estimator is visible
rather than silently mistiming events.

## 7. Failure modes

- **No pong / bridge down**: offset stays 0 (local time), ticks unaffected.
- **Disconnect**: pings stop, estimate resets to 0, ticks keep running.
- **Worker crash**: respawn + subscription replay (§5); the dead socket is
  detected by the watchdog within `STATUS_REPLY_TIMEOUT_MS + 1 s`.
- **Wall-clock step (NTP adjust, suspend/resume)**: RTT and tick phase are
  monotonic and unaffected; the offset estimate re-converges within at most
  the 8-sample window (~16 s — a pre-step min-RTT sample keeps winning until
  it ages out), typically sooner, shifting only not-yet-stamped timetags.
- **Remote scsynth (≠ bridge host)**: unsupported assumption — timetags are
  stamped in _bridge_ time; a remote scsynth would need its own offset. One
  comment marks this at the stamp site.
