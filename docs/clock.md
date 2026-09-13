# Bridge clock synchronization & the tick-driven scheduler

How the app keeps ONE timebase across the webview, the OSC worker,
sclang, and scsynth — with a three-message protocol the bridge only
routes. Companion to `scope.md` (the one remaining bridge-internal
protocol family).

## 1. The problem

Two distinct problems share one solution:

1. **Background throttling.** Strudel's pattern scheduler (Cyclist → zyklus)
   ticks on `setInterval`. On the main thread, WKWebView (Tauri) and Chrome
   throttle DOM timers to ≥1 s when the window is occluded — ticks arrive too
   late for the ~200 ms scheduling lookahead and events drop or bunch. Web
   Worker timers are exempt, and postMessage delivery to the main thread is
   NOT timer-throttled — so the worker keeps time and the main thread is
   woken by its messages.
2. **A shared timebase.** The header clock shows the AUDIO HOST's wall
   time, and cross-host diagnostics want frontend events comparable with
   host logs. In Tauri `Date.now()` IS that clock; a remote browser
   session (the `serve` mode over a network) needs the offset measured.
   Nothing musical consumes wall time (dirt events carry a relative
   delta — §6), so the anchor is a convenience, not a timing path.

Two inbound streams solve the two problems, each owned by its natural
master (see AUDIO-CLOCK.md for the design's full arc):

- **The metronome is the AUDIO ENGINE itself**: the `__global_clock__`
  synth (loaded by `scripts/sc-startup.scd`) emits a 20 Hz `/clock/tick`
  straight from the sample domain, carrying its ABSOLUTE tick index;
  every `clock.subscribe` callback fires off its arrival.
- **The measurement is the ping/pong round-trip**: the MAIN thread pings
  riding that same metronome (one ping per 2 s of ticks, plus an
  immediate one on the first tick after connect) — the wall-time anchor
  behind `clock.now()` (the header clock and cross-host diagnostics;
  nothing MUSICAL consumes wall time anymore); the pong flows back up as
  an ordinary message and ClockSync completes the round-trip and filters
  the offset estimate.

Deliberate consequences: nothing keeps time while disconnected — Strudel
stops with the session (its `unload()` already stops playback on the
connection loss) — and the stack MUST load the clock synth: the worker
watchdog closes a session whose ticks stop (§7), so the requirement is
ENFORCED, not just assumed.

## 2. Protocol — two wire messages and a tick

All sync traffic is plain OSC messages. The `/clock/*` family is an
ORDINARY peer route: the bridge's "clock" peer forwards it to sclang on
UDP 57120, where the repo-owned `ScAppClock` (scripts/sc-classes)
answers — the bridge never interprets it (only `/scope/*` remains
bridge-internal). Vocabulary lives in
`packages/server-commands/src/commands/clock.ts` ⇄
`scripts/sc-classes/ScAppClock.sc` (the pong's wire layout is pinned by
the codec.test.ts fixture). The postMessage boundary carries NO clock
vocabulary at all: the ping goes down the ordinary send path, the pong
comes back up as an ordinary message (`OscClient.handleReply` consumes it
ahead of the waiters; the logging middleware skips it — the same
`/scope/chunk` treatment), and the worker's only clock-adjacent job is
the tick-stamped watchdog (§7).

### Main ⇄ sclang (routed by the bridge, no interception)

```
→ /clock/ping  clientId:i seq:i             one per 2 s of ticks
← /clock/pong  clientId:i seq:i secs:i fracMs:f
```

The ping is _stateful_, not echo-based: ClockSync keeps the ONE in-flight
ping (`seq` + `performance.now()` at send — at the slow cadence pings are
strictly sequential, so a new ping simply overwrites a lost one's slot).
Peer replies ride the bridge's broadcast fan-out to EVERY session, so the
echoed `clientId` (server-minted per session — the session index,
carried by SessionInfo and armed into ClockSync at connect) is what
picks OUR pongs out; foreign
ids, stale and unknown seqs are ignored, and the slot clears on reset.
The timestamp is `Date.getDate.rawSeconds` — a live system_clock read —
split into integer Unix seconds + float32 fractional ms because sclang's
NetAddr cannot emit an OSC double (f64 Unix-ms squeezed into float32
would quantize to ~2 minutes; secs in int32 rolls over in 2038 —
accepted). The responder runs in sclang's single interpreter thread
(gLangMutex), so its service time can bias `srv` under load — accepted at
the 0.5 Hz cadence for a non-musical anchor.

### scsynth → everyone (the metronome)

```
← /clock/tick  nodeId:i replyId:i tick:f phase:f   __global_clock__, 20 Hz
```

The synth is sclang-authored, so SendReply's custom address is available
(the old "SendTrig-only" constraint was the COMPILER's — AUDIO-CLOCK
§5.1, superseded): the tick is discriminated by ADDRESS, and `/tr`
belongs entirely to the plugins (always routed to the waiters, always
logged). `tick` is the ABSOLUTE index (`PulseCount` — f32-exact to
`TICK_COUNT_EXACT` = 2^24 ≈ 9.7 days of engine uptime; beyond, the
tracker treats the degradation as a restart and resyncs); a
non-increasing index means the engine or synth restarted. `phase` is the
Phasor's position in its 8192 ring, mirroring bus 1000 (not consumed by
the tracker today). The bridge fan-out broadcasts scsynth traffic to
every session, so ALL clients (sclang's own anchor included) count the
same self-locating timeline.

## 3. Clock domains (the load-bearing rules)

Three clocks are in play; mixing them wrongly is the classic bug in this kind
of code:

| clock                         | property                                      | used for                                       |
| ----------------------------- | --------------------------------------------- | ---------------------------------------------- |
| `performance.now()`           | monotonic, sub-ms, context-local              | RTT (main thread), watchdog staleness (worker) |
| `Date.now()`                  | shared across window/worker, steppable, ~1 ms | carrying the offset across the thread boundary |
| audio-host wall clock (UNIX ms) | the machine running the audio stack           | the offset's far end — header/diagnostics      |

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
  for `clock.now()`'s wall anchor.
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

`TickTracker` (`src/lib/clock/TickTracker.ts`, composed by ClockSync)
turns the tick stream into a measurable time source. The payload's index
is ABSOLUTE and self-locating, so there is nothing to unwrap or heal: a
UDP drop is just a missing point, and only a non-increasing index
(engine/synth restart, or the 2^24 f32 rollover) forces a resync.
Arrivals regress against the index grid (the slope is the
client↔audio-clock skew), and the minimum residual anchors the mapping
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
   (`deltaMs = (targetTimeSecs − audioTime())·1000 +
   SAFETY_LOOKAHEAD_MS`) and, once the tracker locks, anchored to the
   ABSOLUTE tick axis: `/dirt/play/at [tick, frac, …pairs]` via
   `clock.audioTarget(deltaMs)` — sclang's `ScAppTickAnchor`
   (scripts/sc-classes) converts the target in ITS own domain, both ends
   counting the same self-locating /clock/tick stream, so delivery
   jitter cannot move the event. Pre-lock (~1.6 s after connect) the
   delta travels relative instead — `/dirt/play/in [deltaMs, …pairs]`,
   consumed at arrival by `ScAppDirt`. NO wall-clock conversion anywhere
   on the musical path — no timetags, no bundles, and an NTP step cannot
   shift an event.

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

The session heartbeat is EXACTLY the global clock's `/clock/tick`: the
worker endpoint stamps `markAlive()` only on that address,
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
  watchdog closes the session. sclang dying is the same story: ticks,
  pongs and the clock synth share its fate — one signal, one death.
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
- **Remote scsynth (≠ bridge host)**: unsupported assumption — the audio
  stack (scsynth + sclang) and the bridge share one host; a split would
  need its own offset story.
