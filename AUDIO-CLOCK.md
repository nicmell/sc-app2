# The audio-clock transport — groundwork

Status: **§6 steps 1–4 LANDED, step 5 PARTIAL** — the clock synth ships
from `scripts/sc-startup.scd`, its `/tr` tick is the main thread's
metronome AND the session's only liveness signal, ping/pong is demoted to
the 2 s wall anchor originated by the MAIN thread (riding the metronome),
`/clock/sample` is gone and the worker carries zero clock code (only the
tick-stamped `Watchdog`), the one-way `TickTracker` exposes
`audioNow()`/skew, and the rate-disciplined `SlewedClock` gives Strudel a
step-free `getTime` locked to the engine rate (see `docs/clock.md` for
the current state). Remaining: step 5's wire half (the ping/pong pair +
`core/clock.rs`), gated on the §5.2 resolution. Decisions fixed at
landing time: **20 Hz** tick rate, **sc-startup ownership**
(first-client-wins stays future work), **phase-only payload**, a HARD
metronome switch (no sample fallback), **rate-only discipline** for the
timebase — absolute cross-client phase alignment is a future
shared-transport-origin protocol, not a clock property — and
**tick-only liveness** (no `/status.reply` floor — §5.4 was decided the
other way: the clock-synth requirement is enforced, not worked around).
§1–§5 below are the original groundwork, kept as written.

## 1. Where we are, and what is still wrong

The current clock (docs/clock.md) synchronizes the frontend to the
**bridge's SystemTime**: the worker pings the Rust bridge every 50 ms, each
pong becomes one raw `/clock/sample`, and the main-thread `ClockSync`
min-RTT-filters the samples into an offset while ALSO using their arrival
as the metronome that drives every clock callback. It works, it is small,
and the wire contract it rides on (ping/pong) is pinned byte-exact in both
languages.

But it synchronizes to the wrong master. The clock that actually renders
sound is scsynth's **sample clock** — the DAC's crystal, advancing in
64-sample blocks at the hardware rate. The bridge's SystemTime merely sits
NEAR it on the same host. The two drift (sound-card crystal ≠ system
crystal), and the current design cannot even observe that drift, let alone
correct it. Every property we currently prove — offset, RTT, skew — is a
property of the wrong timeline.

## 2. The idea: let the audio engine emit the clock

Run a small synth in scsynth whose only job is to broadcast the engine's
own timeline:

```
Phasor.ar(trig: 0, rate: 1, start: 0, end: 8192)   → Out.ar(bus 1000)
A2K.kr(phasor)                                       (audio → control)
Impulse.kr(freq: f)                                  (the tick, f ≈ 10–20 Hz)
SendTrig.kr(in: tick, id: 4242, value: phase)        → /tr [nodeId, 4242, phase]
```

This is not hypothetical: it is byte-for-byte the `__global_clock__`
fixture in `packages/synthdef-compiler/examples/node/sclang_parity.ts`,
proven parity-exact against sclang's own compiler, and its constants —
`PHASE_BUS = 1000`, `SHARED_FRAMES = 8192`, `CLOCK_TRIGGER_ID = 4242` —
are already mirrored in `src/constants/osc.ts`. The groundwork was laid
before this document existed.

The tick fires every exactly `sr / f` samples of the audio stream. Tick
*n* IS audio instant `n / f` — drift-free **by construction**, in the only
domain that matters. And each `/tr` carries the Phasor's current phase:
not just "a tick happened" but "the engine was at THIS sample of its
8192-frame ring when it fired" — a sample-accurate anchor per message.

## 3. What the tick buys

1. **The audio clock becomes observable.** Regressing `/tr` arrival times
   against the known `n / f` grid gives the client↔audio-clock rate skew
   (the slope) and the delay jitter (the residuals); the minimum residual
   is a stable anchor — the same NTP clock-filter philosophy the current
   estimator uses, transposed to one-way measurements. The one thing a
   one-way stream cannot give is the absolute offset constant — which
   either stops mattering (work IN the tick domain: musical time = tick
   count, and the only requirement is lookahead > max delay) or is
   calibrated by a slow surviving round-trip (§5.2).

2. **Metronome, watchdog, and liveness collapse into one stream.** The
   `/tr` arrives through the existing scsynth fan-out like any message: it
   wakes the main thread via postMessage (macrotask delivery, never
   background-throttled) exactly as `/clock/sample` does today, so
   `ClockSync`'s sample-driven callback machinery transfers unchanged —
   only the triggering address changes. And a missing tick is a STRONGER
   deadness signal than a missing `/status.reply`: it proves the DSP graph
   itself stopped computing, not merely that a process stopped answering.

3. **A global transport, multi-client for free.** Verified fact (§4): the
   bridge broadcasts every scsynth datagram to EVERY session's WebSocket,
   unfiltered. All tabs — all machines, in `serve` mode — receive the SAME
   ticks: N clients phase-locked to one master clock with zero
   coordination. Server-side, the Phasor's phase sits on bus 1000 where
   any synth can read it — plugin LFOs and sequencers can lock to the same
   transport the frontend counts. One clock, both worlds. This is the
   missing keystone for the SharedWorker future sketched in
   `docs/multi-tab.md`.

4. **The `/clock/*` machinery becomes removable — Rust included.** With
   ticks as metronome+liveness and (at most) a slow round-trip for wall
   calibration, the following die: `/clock/sample` on the postMessage
   boundary, the fast ping loop, `WorkerClock` entirely (the worker ends
   up with ZERO clock code), and eventually `core/clock.rs` plus the
   `/clock/ping` interception in `ws.rs`. Uniquely among all the clock
   designs considered, this one REMOVES from the wire contract instead of
   adding to it.

## 4. Verified integration facts

Checked against the tree at the time of writing:

- **Fan-out is unfiltered.** The scsynth peer's recv task publishes raw
  bytes onto one shared broadcast without reading the OSC address
  (`src-tauri/src/core/peer.rs`), and every WS pump forwards every fan-out
  datagram verbatim (`router/ws.rs`, downlink branch). A `/tr` — any
  address — reaches all clients untouched. The `/clock/*` interception is
  uplink-only and matches exactly `/clock/ping`.
- **The synth is client-loadable with existing machinery.** `sendSynthDef`
  + `/s_new` — the same path every plugin synthdef takes. No Rust change
  of any kind is required to ship this.
- **The compiler covers the graph.** Phasor, A2K, Impulse, SendTrig (and
  Stepper/PulseCount/Sweep, should the design want them) are all in the
  generated registry with kr rates and typed builders, and the parity
  fixture pins the exact bytes.
- **The current `ClockSync` is already the right consumer shape.** It is
  sample-driven with a local listener registry; feeding it ticks instead
  of samples is a change of address, not of architecture.

## 5. The obstacles — honestly

### 5.1 The synthdef-compiler cannot say `SendReply`

`SendReply` — the ugen that would let us pick a custom reply address like
`/clock/tick` — takes its `cmdName` as a **string**, and the compiler has
no string inputs anywhere: every builder input is
`number | UGenInput` (`packages/synthdef-compiler/src/ugen-input.ts`), and
the markup path explicitly throws `"a string literal is not allowed in a
synthdef graph expression"` (`src/lib/synthdef/compileSynthDef.ts`). The
only string encoding in the whole codec is the pstring for def/param/ugen
names.

Consequence: the reply mechanism is **`SendTrig`**, whose address is the
fixed scsynth `/tr` with `[nodeId:i, triggerId:i, value:f]`.
Discrimination is by `triggerId` (`CLOCK_TRIGGER_ID = 4242`) and/or the
clock synth's nodeId — the frontend must filter `/tr` traffic, since any
plugin synth may legitimately emit its own `/tr` with other ids. A
`SendTrig` carries ONE value; the fixture spends it on the phase. If the
design also wants an explicit tick index (for loss detection, §5.5), the
options are: derive it by unwrapping the phase ring, or add a second
`SendTrig` with a second trigger id carrying a `PulseCount` — both
compile today. Teaching the compiler string arguments (sclang encodes
`cmdName` as `[length, ...ascii]` int constants) is a possible but
non-trivial third path; nothing below depends on it.

### 5.2 The StrudelDirt problem: our timetags are consumed by sclang

Verified: the app's ONLY timetagged traffic is `/dirt/play`, and it is not
consumed by scsynth. The bridge routes `^/dirt(/|$)` to the "strudel" peer
on UDP 57120, where **sclang running the StrudelDirt quark** (a
SuperDirt-compatible implementation, mounted by `scripts/sc-startup.scd`)
reads the NTP timetag, schedules the event on ITS clock — sclang's
wall-clock-based scheduler, with SuperDirt's own added latency — and then
drives scsynth itself. Everything the app sends to scsynth directly
(57110) is a bare, immediate message.

So a perfect client↔audio-clock lock does not, by itself, make `/dirt/play`
sample-accurate: the handoff timetag is still interpreted against sclang's
wall clock, and the gain is laundered through it. Two resolutions, in
increasing ambition:

- **Keep a slow wall anchor.** Retain ping/pong at a relaxed cadence
  (seconds) purely to calibrate bridge wall time for `sendIn`, while
  ticks own metronome/liveness/skew. Crystal drift is ~100 ppm, so even a
  once-a-minute calibration keeps the wall anchor within ~6 ms — well
  inside SuperDirt's own latency slack. This is the pragmatic hybrid.
- **Bypass sclang for timing.** Long-term: schedule scsynth directly in
  the tick domain (timetagged bundles to 57110, or gate/trigger patterns
  anchored to the phase bus), demoting StrudelDirt to a sample library
  host or removing it from the timing path. A much larger departure —
  today nothing timetagged goes to scsynth at all — and out of scope for
  the first iteration.

### 5.3 Ownership and lifecycle of the clock synth

The clock must be a **singleton per scsynth**, not per session, and it
must outlive plugin reloads (it cannot live inside a session's group,
which the bridge frees on WS close, nor inside plugin groups subject to
`gFreeAll`). Two candidate owners:

- **`sc-startup.scd`** loads it at boot beside StrudelDirt: simplest,
  no client logic, but couples the design to the dev scripts (and any
  production launcher) rather than the app.
- **First-client-wins**: each client attempts the install at connect with
  a well-known node id; the duplicate `/s_new` fails harmlessly (`/fail`
  is already toast-noise-tolerated). Needs a reserved id outside the
  per-session node-id blocks — a small allocation-scheme carve-out.

Related: the watchdog must not confuse "clock synth died" with "scsynth
died" (§5.4), and a client that sees ticks stop while `/status.reply`
continues should re-install the clock synth rather than kill the session.

### 5.4 Watchdog false positives

> **Decided at landing time — the OPPOSITE way.** Liveness is the global
> clock's `/tr` tick ONLY: one signal, one meaning — the DSP graph
> computing IS the session being alive. An accidentally-freed (or never
> loaded) clock synth gets a clean close with a clear error within
> `WATCHDOG_TIMEOUT_MS` instead of a zombie session with a silent
> metronome: the clock-synth requirement, enforced. The original
> paragraph below is kept for the record; §5.3's re-install idea remains
> open as a RECOVERY path, not a liveness fallback.

Original consideration: any non-pong inbound message marks the session
alive; if ticks become the ONLY liveness source, an accidentally-freed
clock synth would look like a dead server. Keeping `/status.reply` as a
liveness floor was the alternative — rejected.

### 5.5 Arrival jitter and loss

The tick's INDEX is perfect; its ARRIVAL is not. scsynth computes control
blocks in hardware-buffer bursts, so `/tr` send times carry burst jitter
up to the buffer period (~5–10 ms at typical settings), plus UDP + WS +
postMessage variance on top. The estimator must therefore anchor on
minimum residuals over a window (as the current min-RTT filter does) and
never trust a single arrival. UDP loss is real too: a lost tick must not
shift the timeline — which is exactly why the index/phase must be carried
IN the message (self-locating) rather than inferred by counting arrivals.

### 5.6 Frequency choice

The fixture says 10 Hz; the metronome duty says "at most half the finest
consumer interval" (zyklus asks the Strudel shim for 100 ms → ≥20 Hz for
the same 2× margin the current 50 ms ping keeps). The rate is one
`Impulse.kr` argument — trivially tunable — but it sets the wire/postMessage
budget per session AND the callback quantization, so it should be chosen
once, documented in `src/constants/osc.ts` beside `CLOCK_TRIGGER_ID`, and
pinned by the parity fixture.

### 5.7 What deliberately does not change

Offline semantics stay as decided: no connection → no ticks → nothing
keeps time, and Strudel stops via its unload on connection loss. The
tick stream, like the sample stream today, lives exactly as long as the
session.

## 6. Migration sketch

1. **[DONE] Install the clock synth** (ownership per §5.3: sc-startup.scd)
   and let `/tr` id 4242 flow — it already reaches every client through
   the fan-out; the `/tr`-by-id routing and log-skip live in
   `OscClient.handleReply` and the logging middleware.
2. **[DONE, callbacks half] Feed `ClockSync` from ticks**: the callback
   registry fires from `onTick` (`/tr`), samples are measurement-only
   (watchdog liveness already counts any non-pong inbound message, ticks
   included). The one-way skew/anchor math on the tick's phase payload is
   step 3.
3. **[DONE] Retire the fast ping loop**: ping/pong dropped to the 2 s
   wall-anchor cadence (`CLOCK_PING_INTERVAL_MS`), the sample window back
   to NTP's 8, the store publish un-throttled.
4. **[DONE, tracker half] The one-way skew/anchor estimator** over the
   tick's phase payload: `lib/clock/TickTracker` unwraps the phase into an
   absolute tick index (loss-healing, restart-resyncing), regresses
   arrivals against the grid (skew in ppm), anchors on the minimum
   residual, and exposes `oscClient.clock.audioNow()` / `tickInfo()`.
   Strudel's
   `getTime` in the tick domain stays DEFERRED: Cyclist needs a monotonic,
   step-free time source and the tracker refits per tick — switching it
   requires a designed slew.
5. **[PARTIAL] Sweep the corpse**: `/clock/sample` is DEAD — the ping
   originates on the MAIN thread (ClockSync, riding the tick metronome
   with an immediate first-tick anchor), the pong flows back up as an
   ordinary message, the postMessage boundary carries no clock vocabulary,
   and the worker's clock module is reduced to the tick-stamped
   `Watchdog` (liveness = `/tr` id 4242 only, per §5.4's decision). The
   REMAINDER — the wire ping/pong pair, `core/clock.rs`, and the `ws.rs`
   interception (contract test and all) — stays gated on §5.2 resolving
   toward the direct-scsynth path: as long as `sendIn` stamps wall-clock
   timetags for StrudelDirt, the anchor needs a round-trip.

Each step is independently shippable and independently revertible; step 1
alone already delivers the global multi-client transport.
