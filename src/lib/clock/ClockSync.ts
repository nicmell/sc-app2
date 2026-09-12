// The main-thread half of the bridge clock (docs/clock.md): pure math over
// the worker's raw `/clock/sample` stream, which is BOTH the measurement
// and the metronome —
//
// - Estimator: the min-RTT filter over the sample window, `now()` = wall
//   time + offset. Samples arrive already expressed in the shared
//   `Date.now()` domain, so nothing measures here; living main-side, the
//   estimate survives a worker respawn (only a socket close resets it).
// - Sample-driven callbacks: `subscribe(intervalMs, cb)` registers a purely
//   LOCAL listener fired from sample arrival (postMessage delivery is not
//   background-throttled). Callbacks therefore run only while the socket is
//   open and samples flow — by design: nothing keeps time while
//   disconnected.
//
// Composed by OscClient.

import { ClockSample, type OscMessage } from "@sc-app/server-commands";
import { CLOCK_SAMPLE_WINDOW } from "@/constants/osc";
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

/** Store publishes are throttled to this — the estimate refreshes at the
 *  50 ms sample cadence, but no consumer needs 20 Hz re-renders. */
const PUBLISH_THROTTLE_MS = 500;

interface ClockSyncOptions {
  /** Publish the current filtered estimate (the store's `clock` field). */
  publish: (clock: ClockStatus) => void;
}

export class ClockSync {
  private readonly publish: ClockSyncOptions["publish"];
  private samples: Sample[] = [];
  private offset = 0;
  private lastPublishAt = -Infinity;
  private readonly listeners = new Map<number, Listener>();
  private nextListenerId = 1;

  constructor({ publish }: ClockSyncOptions) {
    this.publish = publish;
  }

  /** Register a sample-driven callback at (a quantization of) `intervalMs`.
   *  Purely local — nothing crosses the worker boundary; the callback fires
   *  only while samples flow (socket open). */
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

  /** Fold one raw `/clock/sample` into the window, publish (throttled), and
   *  run the due callbacks.
   *
   *  Estimate: NTP's clock-filter rule — trust the minimum-delay sample in
   *  the window; queueing delay only ever ADDS to rtt, so the fastest
   *  exchange carries the least-biased offset. Consumers convert clock
   *  domains at stamp time, so a small estimate change only shifts
   *  not-yet-stamped events; no smoothing needed.
   *
   *  Callbacks: each listener fires when `now` passes its `nextDueAt`, then
   *  re-aims one interval ahead — with NO catch-up (a long gap yields one
   *  fire and a realign, never a burst). */
  onSample(message: OscMessage): void {
    const offset = ClockSample.offset(message);
    const rtt = ClockSample.rtt(message);
    if (!Number.isFinite(offset) || !Number.isFinite(rtt)) return;
    this.samples.push({ offset, rtt });
    if (this.samples.length > CLOCK_SAMPLE_WINDOW) this.samples.shift();
    const best = this.samples.reduce((a, b) => (b.rtt < a.rtt ? b : a));
    this.offset = best.offset;

    const now = Date.now();
    if (now - this.lastPublishAt >= PUBLISH_THROTTLE_MS) {
      this.lastPublishAt = now;
      this.publish({ offset: best.offset, rtt: best.rtt });
    }

    for (const listener of this.listeners.values()) {
      if (now >= listener.nextDueAt) {
        listener.cb();
        listener.nextDueAt += listener.intervalMs;
        if (listener.nextDueAt <= now) listener.nextDueAt = now + listener.intervalMs;
      }
    }
  }

  /** Back to the unlocked estimate (socket closed — no samples coming).
   *  Listeners stay registered: their lifecycle belongs to the consumers. */
  reset(): void {
    this.samples = [];
    this.offset = 0;
    this.lastPublishAt = -Infinity;
    this.publish({ offset: 0, rtt: 0 });
  }

  /** Bridge-wall-clock milliseconds. Offset is zero before sync/disconnected. */
  now(): number {
    return Date.now() + this.offset;
  }
}
