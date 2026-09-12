// The app clock, whole (docs/clock.md, AUDIO-CLOCK.md) — measurement AND
// consumption both live main-side; the worker carries no clock code.
// Everything is paced by ONE stream, the audio engine's `/tr` ticks (the
// `__global_clock__` synth loaded by scripts/sc-startup.scd):
//
// - Metronome (`onTick`): `subscribe(intervalMs, cb)` registers a purely
//   LOCAL listener that fires every `round(intervalMs / tickPeriod)` TICKS
//   (postMessage delivery is not background-throttled, and counting ticks
//   needs no wall clock at all — a burst after a gap is impossible by
//   construction). Callbacks therefore run only while the socket is open
//   and the clock synth ticks — by design: nothing keeps time while
//   disconnected, and the stack MUST load the clock synth.
// - Estimator (`ping()`/`onPong`): a tick countdown ORIGINATES the
//   /clock/ping (one per PING_EVERY_TICKS, 2 s nominal; a fresh/reset
//   clock fires on the FIRST tick so the anchor lands right after
//   connect) and the pong completes the round-trip, t0/t1 both in the
//   main thread's `performance.now()`. The postMessage hops land in the
//   RTT — accepted: at the slow anchor cadence the min-RTT filter over
//   the sample window eats them. `now()` = wall time + offset.
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

const TICK_PERIOD_MS = 1000 / CLOCK_TICK_FREQ_HZ;
/** The anchor cadence, quantized to the metronome it rides. */
const PING_EVERY_TICKS = Math.round(CLOCK_PING_INTERVAL_MS / TICK_PERIOD_MS);

interface Sample {
  offset: number;
  rtt: number;
}

interface Listener {
  everyTicks: number;
  countdown: number;
  cb: () => void;
}

interface ClockSyncOptions {
  /** Publish the current filtered estimate (the store's `clock` field);
   *  null = no anchor (fresh or reset — nothing measured yet). */
  publish: (clock: ClockStatus | null) => void;
  /** Send one /clock/ping toward the bridge (OscClient.dispatch — the
   *  open-guard is a second net: no pings while disconnected, consistent
   *  with the ticks that pace them). */
  sendPing: (message: OscMessage) => void;
}

export class ClockSync {
  private readonly publish: ClockSyncOptions["publish"];
  private readonly sendPing: ClockSyncOptions["sendPing"];
  private samples: Sample[] = [];
  private readonly listeners = new Map<number, Listener>();
  private nextListenerId = 1;
  /** The one in-flight ping (seq + send time, main performance.now) — at
   *  the slow cadence pings are strictly sequential, so a new ping simply
   *  overwrites a lost one's slot. */
  private outstanding: { seq: number; t0: number } | null = null;
  private sequence = 0;
  /** Ticks until the next anchor ping; 0 fires on the NEXT tick, so a
   *  fresh/reset clock anchors on the first tick of the connection. */
  private ticksUntilPing = 0;
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
  }

  private ping(): void {
    const seq = this.sequence++;
    this.outstanding = { seq, t0: performance.now() };
    this.sendPing(clockPing(seq));
  }

  /** The minimum-delay sample in the window — NTP's clock-filter rule:
   *  queueing delay only ever ADDS to rtt, so the fastest exchange
   *  carries the least-biased offset. Null before the first pong. */
  private best(): Sample | null {
    if (this.samples.length === 0) return null;
    return this.samples.reduce((a, b) => (b.rtt < a.rtt ? b : a));
  }

  /** Register a tick-driven callback at (a quantization of) `intervalMs`:
   *  it fires every `round(intervalMs / tickPeriod)` ticks. Purely local —
   *  nothing crosses the worker boundary; fire COUNT must never be
   *  converted back to elapsed time (a lost tick slips the schedule by
   *  one period). */
  subscribe(intervalMs: number, cb: () => void): { id: number; off: () => void } {
    const id = this.nextListenerId++;
    const everyTicks = Math.max(1, Math.round(intervalMs / TICK_PERIOD_MS));
    this.listeners.set(id, { everyTicks, countdown: everyTicks, cb });
    return {
      id,
      off: () => {
        this.listeners.delete(id);
      },
    };
  }

  /** One /clock/pong: complete the round-trip against the in-flight slot
   *  (unknown or replayed seqs are ignored), fold the sample into the
   *  min-RTT window and publish. The MEASUREMENT stream only — the
   *  metronome is `onTick`. */
  onPong(message: OscMessage): void {
    if (this.outstanding === null || this.outstanding.seq !== ClockPong.seq(message)) return;
    const rtt = performance.now() - this.outstanding.t0;
    this.outstanding = null;
    const offset = ClockPong.serverTime(message) + rtt / 2 - Date.now();
    if (!Number.isFinite(offset) || !Number.isFinite(rtt) || rtt < 0) return;
    this.samples.push({ offset, rtt });
    if (this.samples.length > CLOCK_SAMPLE_WINDOW) this.samples.shift();
    const best = this.best() as Sample;
    this.publish({ offset: best.offset, rtt: best.rtt });
  }

  /** One `/tr` tick from the audio engine's `__global_clock__` synth: feed
   *  the one-way tracker with the phase payload, run the anchor-ping
   *  countdown, aim the slewed timebase, then run the METRONOME — each
   *  listener fires when its tick countdown runs out. No wall clock
   *  anywhere: intervals quantize to the tick rate (`CLOCK_TICK_FREQ_HZ`)
   *  and a gap yields exactly the fires its ticks pay for — never a
   *  burst, and immune to wall-clock steps. */
  onTick(message: OscMessage): void {
    this.tracker.onTick(Tr.value(message));
    if (this.ticksUntilPing <= 0) {
      this.ping();
      this.ticksUntilPing = PING_EVERY_TICKS;
    }
    this.ticksUntilPing--;
    // Aim the slewed timebase at the inverse of the measured skew (the
    // local clock RUNS at 1+skew vs the engine; the disciplined clock
    // compensates). Unlocked → back toward the plain local rate.
    const skew = this.tracker.skewPpm;
    this.slewed.setTargetRate(skew === null ? 1 : 1 / (1 + skew * 1e-6));
    for (const listener of this.listeners.values()) {
      if (--listener.countdown <= 0) {
        listener.countdown = listener.everyTicks;
        listener.cb();
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

  /** Back to the unanchored state (socket closed — nothing measures);
   *  the next first tick re-anchors and the tick tracker re-locks from
   *  scratch on reconnect (~1.6 s). Listeners stay registered: their
   *  lifecycle belongs to the consumers. */
  reset(): void {
    this.samples = [];
    this.outstanding = null;
    this.ticksUntilPing = 0;
    this.tracker.reset();
    this.slewed.setTargetRate(1); // glide back to the local rate — no step
    this.publish(null);
  }

  /** Bridge-wall-clock milliseconds. Offset is zero before sync/disconnected. */
  now(): number {
    return Date.now() + (this.best()?.offset ?? 0);
  }
}
