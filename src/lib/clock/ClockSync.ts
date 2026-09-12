// The app clock, whole (docs/clock.md, AUDIO-CLOCK.md) — measurement AND
// consumption both live main-side now; the worker carries no clock code.
// Two independent inbound streams, each owning one job:
//
// - Estimator (`ping()`/`onPong`): this class ORIGINATES the /clock/ping
//   (riding the metronome below — no timer of its own) and completes the
//   round-trip when the pong flows back up, t0/t1 both in the main
//   thread's `performance.now()`. The postMessage hops land in the RTT —
//   accepted: at the slow anchor cadence the min-RTT filter over the
//   sample window eats them. `now()` = wall time + offset.
// - Metronome (`onTick`, fed by the AUDIO ENGINE's `/tr` ticks — the
//   `__global_clock__` synth loaded by scripts/sc-startup.scd):
//   `subscribe(intervalMs, cb)` registers a purely LOCAL listener fired
//   from tick arrival (postMessage delivery is not background-throttled).
//   Callbacks therefore run only while the socket is open and the clock
//   synth ticks — by design: nothing keeps time while disconnected, and
//   the stack MUST load the clock synth.
//
// Composed by OscClient.

import { ClockPong, clockPing, Tr, type OscMessage } from "@sc-app/server-commands";
import {
  CLOCK_PING_INTERVAL_MS,
  CLOCK_SAMPLE_WINDOW,
  CLOCK_TICK_FREQ_HZ,
  PHASE_RING_FRAMES,
} from "@/constants/osc";
import { SlewedClock } from "./SlewedClock";
import { TickTracker } from "./TickTracker";
import type { ClockStatus } from "@/types/stores";

interface Sample {
  offset: number;
  rtt: number;
}

interface Listener {
  intervalMs: number;
  cb: () => void;
  /** Next due time in the `Date.now()` domain. */
  nextDueAt: number;
}

interface ClockSyncOptions {
  /** Publish the current filtered estimate (the store's `clock` field). */
  publish: (clock: ClockStatus) => void;
  /** Send one /clock/ping toward the bridge (OscClient.dispatch — the
   *  open-guard is a second net: no pings while disconnected, consistent
   *  with the ticks that pace them). */
  sendPing: (message: OscMessage) => void;
}

export class ClockSync {
  private readonly publish: ClockSyncOptions["publish"];
  private readonly sendPing: ClockSyncOptions["sendPing"];
  private samples: Sample[] = [];
  private offset = 0;
  private readonly listeners = new Map<number, Listener>();
  private nextListenerId = 1;
  /** seq → send time (main performance.now). Stale entries linger until
   *  reset — bounded by the ping cadence, accepted. */
  private readonly pending = new Map<number, number>();
  private sequence = 0;
  private pingedSinceReset = false;
  /** The one-way audio-clock tracker fed by the ticks' phase payload. */
  private readonly tracker = new TickTracker({
    freqHz: CLOCK_TICK_FREQ_HZ,
    ringFrames: PHASE_RING_FRAMES,
  });
  /** The monotonic rate-disciplined timebase (Strudel's getTime). */
  private readonly slewed = new SlewedClock();

  constructor({ publish, sendPing }: ClockSyncOptions) {
    this.publish = publish;
    this.sendPing = sendPing;
    // The wall anchor rides the metronome itself: one ping per
    // CLOCK_PING_INTERVAL_MS of ticks (plus an immediate first ping per
    // connection, see onTick) — no timer of its own.
    this.subscribe(CLOCK_PING_INTERVAL_MS, () => this.ping());
  }

  private ping(): void {
    const seq = this.sequence++;
    this.pending.set(seq, performance.now());
    this.pingedSinceReset = true;
    this.sendPing(clockPing(seq));
  }

  /** Register a tick-driven callback at (a quantization of) `intervalMs`.
   *  Purely local — nothing crosses the worker boundary; the callback fires
   *  only while the audio engine's `/tr` ticks flow (socket open + clock
   *  synth running). */
  subscribe(intervalMs: number, cb: () => void): { id: number; off: () => void } {
    const id = this.nextListenerId++;
    this.listeners.set(id, { intervalMs, cb, nextDueAt: Date.now() + intervalMs });
    return {
      id,
      off: () => {
        this.listeners.delete(id);
      },
    };
  }

  /** One /clock/pong: complete the round-trip measured entirely on the
   *  main thread (t0/t1 in this context's performance.now — the
   *  postMessage hops land in rtt, and at the slow anchor cadence the
   *  min-RTT filter eats them), fold the sample into the window and
   *  publish. NTP's clock-filter rule — trust the minimum-delay sample in
   *  the window; queueing delay only ever ADDS to rtt, so the fastest
   *  exchange carries the least-biased offset. The MEASUREMENT stream
   *  only — the metronome is `onTick`. */
  onPong(message: OscMessage): void {
    const t0 = this.pending.get(ClockPong.seq(message));
    if (t0 === undefined) return; // stale or foreign
    this.pending.delete(ClockPong.seq(message));
    const rtt = performance.now() - t0;
    const offset = ClockPong.serverTime(message) + rtt / 2 - Date.now();
    if (!Number.isFinite(offset) || !Number.isFinite(rtt) || rtt < 0) return;
    this.samples.push({ offset, rtt });
    if (this.samples.length > CLOCK_SAMPLE_WINDOW) this.samples.shift();
    const best = this.samples.reduce((a, b) => (b.rtt < a.rtt ? b : a));
    this.offset = best.offset;
    this.publish({ offset: best.offset, rtt: best.rtt });
  }

  /** One `/tr` tick from the audio engine's `__global_clock__` synth: feed
   *  the one-way tracker with the phase payload, then run the METRONOME —
   *  each listener fires when `now` passes its `nextDueAt`, then re-aims
   *  one interval ahead, with NO catch-up (a long gap yields one fire and
   *  a realign, never a burst). Intervals quantize to the tick rate
   *  (`CLOCK_TICK_FREQ_HZ`). */
  onTick(message: OscMessage): void {
    this.tracker.onTick(Tr.value(message));
    // First tick of a connection: anchor immediately instead of one ping
    // interval later.
    if (!this.pingedSinceReset) this.ping();
    // Aim the slewed timebase at the inverse of the measured skew (the
    // local clock RUNS at 1+skew vs the engine; the disciplined clock
    // compensates). Unlocked → back toward the plain local rate.
    const skew = this.tracker.skewPpm;
    this.slewed.setTargetRate(skew === null ? 1 : 1 / (1 + skew * 1e-6));
    const now = Date.now();
    for (const listener of this.listeners.values()) {
      if (now >= listener.nextDueAt) {
        listener.cb();
        listener.nextDueAt += listener.intervalMs;
        if (listener.nextDueAt <= now) listener.nextDueAt = now + listener.intervalMs;
      }
    }
  }

  /** The audio engine's current time in seconds (one-way estimate) — null
   *  until the tracker locks. See TickTracker. */
  audioNow(): number | null {
    return this.tracker.audioNow();
  }

  /** The monotonic, rate-disciplined timebase (seconds) — always
   *  available: engine rate when locked, plain local rate otherwise, and
   *  every transition slews. Strudel's getTime. */
  audioTime(): number {
    return this.slewed.time();
  }

  /** Tracker diagnostics: lock state, absolute tick index, local-vs-audio
   *  clock skew. */
  tickInfo(): { locked: boolean; tickIndex: number | null; skewPpm: number | null } {
    return {
      locked: this.tracker.locked,
      tickIndex: this.tracker.tickIndex,
      skewPpm: this.tracker.skewPpm,
    };
  }

  /** Back to the unlocked estimate (socket closed — no samples coming);
   *  the tick tracker re-locks from scratch on reconnect (~1.6 s).
   *  Listeners stay registered: their lifecycle belongs to the consumers. */
  reset(): void {
    this.samples = [];
    this.offset = 0;
    this.pending.clear();
    this.pingedSinceReset = false;
    this.tracker.reset();
    this.slewed.setTargetRate(1); // glide back to the local rate — no step
    this.publish({ offset: 0, rtt: 0 });
  }

  /** Bridge-wall-clock milliseconds. Offset is zero before sync/disconnected. */
  now(): number {
    return Date.now() + this.offset;
  }
}
