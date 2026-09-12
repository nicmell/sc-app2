# Bridge clock synchronization & the tick-driven scheduler

How the app keeps ONE timebase across the webview, the OSC worker, the Rust
bridge, and scsynth — with a three-message protocol. Companion to
`scope.md` (the other bridge-internal protocol family).

## 1. The problem

Two distinct problems share one solution:

1. **Background throttling.** Strudel's pattern scheduler (Cyclist → zyklus)
   ticks on `setInterval`. On the main thread, WKWebView (Tauri) and Chrome
   throttle DOM timers to ≥1 s when the window is occluded — ticks arrive too
   late for the ~200 ms scheduling lookahead and events drop or bunch. Web
   Worker timers are exempt, and postMessage delivery to the main thread is
   NOT timer-throttled — so the worker keeps time and the main thread is
   woken by its messages.
2. **A shared timebase.** Outgoing OSC bundles carry NTP timetags that scsynth
   executes sample-accurately against _its_ host clock. As long as the webview
   runs on the same machine, `Date.now()` agrees with that clock; a remote
   browser session (the `serve` mode over a network) does not. The app needs
   "bridge time" — the clock of the machine running the bridge and scsynth —
   available everywhere timetags are stamped.

Two inbound streams solve the two problems, each owned by its natural
master (see AUDIO-CLOCK.md for the design's full arc):

- **The metronome is the AUDIO ENGINE itself**: the `__global_clock__`
  synth (loaded by `scripts/sc-startup.scd`) emits a 20 Hz `/tr` tick
  (trigger id `CLOCK_TRIGGER_ID`) straight from the sample domain; every
  `clock.subscribe` callback fires off its arrival.
- **The measurement is the ping/pong round-trip**: the MAIN thread pings
  the bridge riding that same metronome (one ping per 2 s of ticks, plus
  an immediate one on the first tick after connect) — the wall-time
  anchor for `sendIn`'s timetags; the pong flows back up as an ordinary
  message and ClockSync completes the round-trip and filters the offset
  estimate.

Deliberate consequences: nothing keeps time while disconnected — Strudel
stops with the session (its `unload()` already stops playback on the
connection loss) — and the stack MUST load the clock synth: the worker
watchdog closes a session whose ticks stop (§7), so the requirement is
ENFORCED, not just assumed.

## 2. Protocol — two wire messages and a tick

All sync traffic is plain OSC messages. Like `/scope/*`, the `/clock/*`
family is **bridge-internal**: the WS pump intercepts the ping before peer
routing (`src-tauri/src/core/router/ws.rs`), and the strudel/scsynth peer
regexes never match it. Vocabulary lives in
`packages/server-commands/src/commands/clock.ts` ⇄
`src-tauri/src/core/clock.rs` (the exact `/clock/pong` wire bytes are pinned
byte-for-byte in both languages' test suites). The postMessage boundary
carries NO clock vocabulary at all: the ping goes down the ordinary send
path, the pong comes back up as an ordinary message (`OscClient.handleReply`
consumes it ahead of the waiters; the logging middleware skips it — the
same `/scope/chunk` treatment), and the worker's only clock-adjacent job
is the tick-stamped watchdog (§7).

### Main ⇄ bridge (through the worker, no interception)

```
→ /clock/ping  seq:i          one per CLOCK_PING_INTERVAL_MS (2 s) of ticks
← /clock/pong  seq:i  srv:d   srv = bridge SystemTime, UNIX ms as f64
```

The ping is _stateful_, not echo-based: ClockSync keeps the ONE in-flight
ping (`seq` + `performance.now()` at send — at the slow cadence pings are
strictly sequential, so a new ping simply overwrites a lost one's slot),
so no timestamp needs a round-trip and the only double on the wire is
Rust-encoded (osc-js decodes type `d` natively — the TS codec never needs
to encode one). Stale or unknown seqs are ignored; the slot clears on
reset. The bridge captures `srv` _before_ replying (ahead of any await, so
send backpressure can't bias the timestamp) and answers inline on the same
socket.

### scsynth → everyone (the metronome)

```
← /tr  nodeId:i 4242:i phase:f   the __global_clock__ synth, 20 Hz
```

`/tr` is scsynth's fixed SendTrig address (the compiler cannot encode a
custom SendReply address — AUDIO-CLOCK.md §5.1), so the tick is
discriminated by trigger id: `handleReply` routes `CLOCK_TRIGGER_ID` to
the metronome and lets every other `/tr` fall through to the waiters (a
plugin's own SendTrig stays fully usable, and logged). The value is the
clock synth's Phasor phase — the one-way TickTracker's feed (§5). The
bridge fan-out broadcasts scsynth
traffic to every session, so ALL clients share the same ticks.

## 3. Clock domains (the load-bearing rules)

Three clocks are in play; mixing them wrongly is the classic bug in this kind
of code:

| clock                         | property                                      | used for                                       |
| ----------------------------- | --------------------------------------------- | ---------------------------------------------- |
| `performance.now()`           | monotonic, sub-ms, context-local              | RTT (main thread), watchdog staleness (worker) |
| `Date.now()`                  | shared across window/worker, steppable, ~1 ms | carrying the offset across the thread boundary |
| bridge `SystemTime` (UNIX ms) | scsynth's host clock                          | the target domain — timetags                   |

- **RTT** is measured entirely in the MAIN thread's monotonic domain:
  `rtt = performance.now()@pong − t0`. The postMessage hops to and from
  the worker land in it — accepted: at the 0.5 Hz anchor cadence the
  min-RTT filter eats them (§4).
- **Offset** is expressed over `Date.now()`, the wall domain timetags
  start from: `offset = srv + rtt/2 − Date.now()@pong`, and
  `clock.now() = Date.now() + offset`.

In Tauri, bridge and webview share the host clock, so `offset ≈ 0 ± rtt/2` —
that is also the explicit degraded mode (before the first pong, and while
disconnected the estimate resets to 0). The estimator earns its keep when the
browser and bridge are different machines.

## 4. The estimator — all main-side, riding the metronome

`src/lib/clock/ClockSync.ts` (composed by OscClient) owns the whole loop:

- **Measurement**: a tick countdown in `onTick` sends one ping every
  `PING_EVERY_TICKS` ticks (2 s nominal) and starts at zero, so a
  fresh/reset clock anchors on the FIRST tick of the connection instead
  of one interval later. Riding the metronome means no timer of its own,
  and pings flow only while ticks do: a dead stack stops measuring by
  construction. The in-flight slot completes `rtt`/`offset` per §3; after
  the first anchor the round-trip only tracks crystal drift (~100 ppm)
  for `sendIn`'s wall-time anchor.
- **Filtering**: samples fold into a ring of `CLOCK_SAMPLE_WINDOW` (8 —
  NTP's clock-filter register, ~16 s at the 2 s cadence), and the estimate
  is simply the
  **minimum-RTT sample's offset** — NTP's clock-filter insight: queueing
  delay only ever _adds_ to RTT, so the fastest exchange carries the
  least-biased offset. No smoothing/slew: consumers convert domains only at
  stamp time (§6), so an estimate change merely shifts not-yet-stamped
  events. A socket close resets the estimate (the store's `clock` goes
  back to null — unanchored, not a fake zero measurement). Every sample
  publishes to the store (at 0.5 Hz no throttle is needed).

Each `CLOCK_*` constant carries its own rationale where it is defined
(`src/constants/osc.ts`, the "bridge clock" block).

## 5. Tick-driven clock callbacks

`oscClient.clock.subscribe(intervalMs, cb)` registers a purely LOCAL listener
in ClockSync — nothing crosses the worker boundary. The registry counts
TICKS, not wall time: a listener fires every
`round(intervalMs / tickPeriod)` ticks, so intervals quantize to the tick
cadence (`CLOCK_TICK_FREQ_HZ`, 20 Hz = 50 ms) and every consumer tolerates
that (zyklus asks for 100 ms, everything else is ≥1 s). No wall clock
anywhere in the metronome: a gap yields exactly the fires its ticks pay
for (a burst is impossible by construction, and a wall-clock step cannot
park the schedule). The corollary: fire COUNT must never be converted
back to elapsed time — a lost tick slips every later fire by one period.

Lifecycle: callbacks fire only while the socket is open and the clock synth
ticks — by design, nothing keeps time while disconnected, and the metronome
IS the audio engine: a stalled DSP graph visibly stalls the app's sense of
time instead of lying about it. Listener registrations belong to the
consumers (mount/unmount), survive reconnects and worker respawns for free
(they are plain main-side state), and need no replay.

### The one-way tick tracker

The same ticks also carry the Phasor's phase, and `TickTracker`
(`src/lib/clock/TickTracker.ts`, composed by ClockSync) turns that payload
into a measurable time source: the phase delta is unwrapped into an
absolute tick index (self-healing through UDP loss — the index is derived
from the inter-arrival time and VERIFIED against the phase, block-quantized
tolerance included; an unexplainable arrival means the engine restarted →
resync and re-lock), arrivals regress against the tick grid (the slope is
the client↔audio-clock skew), and the minimum residual anchors the mapping
(one-way min-filter: delivery delay only ever adds).
`oscClient.clock.audioNow()` exposes the engine's estimated time in
seconds (null until the ~1.6 s lock), `clock.tickInfo()` the diagnostics.

### The slewed audio timebase

`audioNow` chases the absolute estimate and may step on refits — Cyclist
cannot drink from it. `SlewedClock` (`src/lib/clock/SlewedClock.ts`) is
the disciplined counterpart: a monotonic clock whose RATE slews toward
the inverse of the measured skew with a bounded slope (±1000 ppm max
adjustment, 50 ppm/s max change — a full swing absorbs in seconds, far
inside the 200 ms lookahead), and glides back to the plain local rate on
unlock. Rate-only by design: Cyclist consumes deltas, so the absolute
offset is irrelevant (cross-client PHASE alignment is a future
shared-transport-origin protocol). `oscClient.clock.audioTime()` exposes
it —
always available, never a step.

## 6. Consumers

**Strudel (`src/sc-elements/widgets/sc-strudel`).** Two independent hooks:

1. _Scheduling_: per-element `setInterval`/`clearInterval` shims over
   `oscClient.clock.subscribe` are injected into `StrudelMirror` (forwarded to
   `repl()` → `Cyclist` → zyklus, which asks for 100 ms), so the pattern
   scheduler wakes on the audio engine's tick arrival — immune to
   background throttling.
   `getTime` is `oscClient.clock.audioTime()`: the slewed audio timebase —
   **monotonic and step-free** (the Cyclist invariant: a backward step
   would stall its phase math, a forward one would drop haps), locked to
   the ENGINE's rate once the tracker locks, so the pattern grid keeps
   the engine's tempo instead of the local crystal's. On connection loss
   the plugin unload pass stops playback (`unload()`); cleanup is
   structural:
   `disconnectedCallback → mirror.stop() → Cyclist.stop() → clearInterval`.
2. _Stamping_: the deadline is computed entirely in the audioTime domain
   and shipped as a RELATIVE delta —
   `oscClient.sendIn(message, (targetTimeSecs − audioTime())·1000 +
   SAFETY_LOOKAHEAD_MS)`. `sendIn(packet, inMs)` converts to the
   bridge-time timetag `round(clock.now() + inMs)` and sends it as the `at`
   metadata beside the message (the worker endpoint builds the OSC bundle
   at encode time): the ONE wall-clock conversion point in the app, and
   the delta is domain-free for callers (rate error over a lookahead-sized
   delta is sub-µs). The timetag is correct because scsynth shares the
   bridge host clock.

**Layout autosave (`SessionManager`).** The 10 s layout `PUT` rides a clock
subscription — meaningful only while connected, which is exactly when the
clock synth ticks.

**Header clock (`DashboardHeader`).** The bridge-time wall clock in the top
bar: `clock.now()` re-read on a 1 s subscription, with the current offset
beside it — the whole pipeline (ping loop + estimate) made visible. Hidden
while disconnected.

**Diagnostics.** ClockSync publishes every new estimate into the osc store
slice (`useClockStatus()` → `{offset, rtt}`, null while unanchored), so a
broken estimator is visible rather than silently mistiming events.

## 7. The heartbeat watchdog (worker-side)

The session heartbeat is EXACTLY the global clock's `/tr` tick: the worker
endpoint stamps `markAlive()` only on `ADDR_TR` with `CLOCK_TRIGGER_ID`,
and a worker-timer poll (`CLOCK_WATCHDOG_INTERVAL_MS`) fires `onDead` once
when `WATCHDOG_TIMEOUT_MS` (5 s = 100 missed ticks) passes without one.
One signal, one meaning — the DSP graph computing IS the session being
alive. Neither the pong nor `/status.reply` counts: the bridge answers
pings and relays heartbeats even with the audio graph useless, and a
stack that never loads `__global_clock__` must be declared dead (a clean
close with a clear error) instead of limping along with a silent
metronome — the clock-synth requirement, enforced. The endpoint surfaces
`onDead` as an ordinary transport error: the errors middleware toasts it,
and OscClient's "a transport error is critical" policy closes the session.

The watchdog (`src/lib/worker/watchdog.ts`) lives in the WORKER on
purpose: its timer must not depend on the (possibly silently dead)
connection it watches, and worker timers are never background-throttled —
a main-thread watchdog would detect late in an occluded window.

## 8. Failure modes

- **No ticks / bridge down**: offset stays 0 (local time); no clock
  callbacks (and so no pings either); within `WATCHDOG_TIMEOUT_MS` the
  watchdog closes the session.
- **Disconnect**: ticks stop, so pings stop with them; the estimate resets
  to 0, callbacks stop; the plugin unload pass stops Strudel playback (by
  design — nothing keeps time offline).
- **Bridge hiccup while connected**: ticks pause; Cyclist misses wakes.
  Beyond the ~200 ms lookahead this is an audible gap — the accepted trade
  for a wire-driven metronome (no idle traffic, no separate tick stream).
  A LOST tick (UDP) is the milder cousin: every later fire slips by one
  50 ms period — zyklus's lookahead absorbs a couple of consecutive
  losses on the localhost hop.
- **Worker crash**: respawn; the synthesized close resets the estimate,
  and on the next open the first tick re-anchors (the ping originates
  main-side — the fresh worker carries no clock state at all); listener
  registrations are main-side state and need no replay.
- **Clock synth dead, scsynth alive**: ticks stop, so the watchdog closes
  the session within `WATCHDOG_TIMEOUT_MS` with "global clock ticks
  stopped" — no zombie session with a silent metronome (a stack that never
  loaded the synth gets the same treatment). Re-installing the synth
  automatically is AUDIO-CLOCK.md §5.3 territory (future); today the fix
  is restarting the stack.
- **Wall-clock step (NTP adjust, suspend/resume)**: RTT is monotonic and
  unaffected, and the metronome counts ticks — no listener can be parked
  by a step; the offset estimate re-converges as the pre-step samples age
  out of the window (at most ~16 s), shifting only not-yet-stamped
  timetags.
- **Remote scsynth (≠ bridge host)**: unsupported assumption — timetags are
  stamped in _bridge_ time; a remote scsynth would need its own offset.
  `sendIn`'s doc comment marks this.
