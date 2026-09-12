// The main-thread half of the app clock (docs/clock.md, AUDIO-CLOCK.md).
// Two independent inbound streams, each owning one job:
//
// - Estimator (`onSample`, fed by the worker's raw `/clock/sample`s): the
//   min-RTT filter over the sample window, `now()` = wall time + offset.
//   Samples arrive already expressed in the shared `Date.now()` domain, so
//   nothing measures here; living main-side, the estimate survives a
//   worker respawn (only a socket close resets it).
// - Metronome (`onTick`, fed by the AUDIO ENGINE's `/tr` ticks — the
//   `__global_clock__` synth loaded by scripts/sc-startup.scd):
//   `subscribe(intervalMs, cb)` registers a purely LOCAL listener fired
//   from tick arrival (postMessage delivery is not background-throttled).
//   Callbacks therefore run only while the socket is open and the clock
//   synth ticks — by design: nothing keeps time while disconnected, and
//   the stack MUST load the clock synth.
//
// Composed by OscClient.

import { ClockSample, Tr, type OscMessage } from "@sc-app/server-commands";
import { CLOCK_SAMPLE_WINDOW, CLOCK_TICK_FREQ_HZ, PHASE_RING_FRAMES } from "@/constants/osc";
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
}

export class ClockSync {
  private readonly publish: ClockSyncOptions["publish"];
  private samples: Sample[] = [];
  private offset = 0;
  private readonly listeners = new Map<number, Listener>();
  private nextListenerId = 1;
  /** The one-way audio-clock tracker fed by the ticks' phase payload. */
  private readonly tracker = new TickTracker({
    freqHz: CLOCK_TICK_FREQ_HZ,
    ringFrames: PHASE_RING_FRAMES,
  });

  constructor({ publish }: ClockSyncOptions) {
    this.publish = publish;
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

  /** Fold one raw `/clock/sample` into the window and publish. NTP's
   *  clock-filter rule — trust the minimum-delay sample in the window;
   *  queueing delay only ever ADDS to rtt, so the fastest exchange carries
   *  the least-biased offset. Consumers convert clock domains at stamp
   *  time, so a small estimate change only shifts not-yet-stamped events;
   *  no smoothing needed. The MEASUREMENT stream only — the metronome is
   *  `onTick`. */
  onSample(message: OscMessage): void {
    const offset = ClockSample.offset(message);
    const rtt = ClockSample.rtt(message);
    if (!Number.isFinite(offset) || !Number.isFinite(rtt)) return;
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
    this.tracker.reset();
    this.publish({ offset: 0, rtt: 0 });
  }

  /** Bridge-wall-clock milliseconds. Offset is zero before sync/disconnected. */
  now(): number {
    return Date.now() + this.offset;
  }
}
