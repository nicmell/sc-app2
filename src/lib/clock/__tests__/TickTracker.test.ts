// The one-way audio-clock tracker, driven by synthetic tick streams that
// reproduce the real signal shape: absolute self-locating indexes
// (PulseCount), local-clock skew, one-sided delivery jitter, UDP drops,
// and index resets (engine/synth restart, f32 rollover degradation).
import { describe, expect, it } from "vitest";
import { TickTracker } from "../TickTracker";

const FREQ = 20;
const PERIOD_MS = 1000 / FREQ;

interface StreamOptions {
  /** Local-clock rate factor: arrivals spaced period·(1+skew). */
  skew?: number;
  /** One-sided delivery jitter per tick, in ms (added, never subtracted). */
  jitter?: (i: number) => number;
  /** Tick indexes never delivered (UDP loss). */
  drops?: Set<number>;
  /** From tick `at` on, the payload index restarts from 1 (PulseCount
   *  reset — engine or synth restart). */
  restart?: { at: number };
  /** The payload index of the first tick (PulseCount starts at 1; the
   *  engine may have run for days before we connect). */
  firstIndex?: number;
  count: number;
}

/** Produce (index, arrivalMs) pairs like the real engine: the payload
 *  carries the ABSOLUTE tick index, arrivals pace the local clock. */
function makeStream({
  skew = 0,
  jitter = () => 0,
  drops,
  restart,
  firstIndex = 1,
  count,
}: StreamOptions) {
  const out: Array<{ index: number; arrival: number }> = [];
  for (let i = 0; i < count; i++) {
    if (drops?.has(i)) continue;
    const index = restart && i >= restart.at ? 1 + (i - restart.at) : firstIndex + i;
    out.push({
      index,
      arrival: 1_000 + i * PERIOD_MS * (1 + skew) + jitter(i),
    });
  }
  return out;
}

function drive(stream: Array<{ index: number; arrival: number }>) {
  let now = 0;
  const tracker = new TickTracker({ freqHz: FREQ, monotonicNow: () => now });
  for (const { index, arrival } of stream) {
    now = arrival;
    tracker.onTick(index);
  }
  return { tracker, setNow: (v: number) => (now = v) };
}

describe("TickTracker", () => {
  it("locks after LOCK_MIN clean ticks with ~zero skew and a linear audioNow", () => {
    const stream = makeStream({ count: 64 });
    const { tracker, setNow } = drive(stream);

    expect(tracker.locked).toBe(true);
    expect(tracker.tickIndex).toBe(63);
    expect(Math.abs(tracker.skewPpm!)).toBeLessThan(20);

    const t0 = tracker.audioNow()!;
    setNow(stream.at(-1)!.arrival + 1_000); // one local second later
    expect(tracker.audioNow()! - t0).toBeCloseTo(1, 2);
  });

  it("stays unlocked before LOCK_MIN ticks", () => {
    const { tracker } = drive(makeStream({ count: 16 }));
    expect(tracker.locked).toBe(false);
    expect(tracker.audioNow()).toBeNull();
    expect(tracker.skewPpm).toBeNull();
    expect(tracker.audioNowTicksAbsolute()).toBeNull();
  });

  it("measures local-clock skew against the audio grid", () => {
    // The local clock runs 200 ppm fast: arrivals stretch accordingly.
    const { tracker } = drive(makeStream({ count: 256, skew: 200e-6 }));
    expect(tracker.locked).toBe(true);
    expect(tracker.skewPpm!).toBeGreaterThan(150);
    expect(tracker.skewPpm!).toBeLessThan(250);
  });

  it("rides one-sided delivery jitter on the min-residual anchor", () => {
    // Deterministic bursty jitter: most ticks late by up to 8 ms, every
    // 16th on the fast path.
    const jitter = (i: number) => (i % 16 === 0 ? 0 : 1 + ((i * 7) % 8));
    const { tracker } = drive(makeStream({ count: 256, jitter }));
    expect(tracker.locked).toBe(true);
    expect(Math.abs(tracker.skewPpm!)).toBeLessThan(300);
  });

  it("sails through UDP drops — the index is self-locating", () => {
    const drops = new Set([40, 41, 42, 80, 120, 121, 122, 123, 124, 125, 126]);
    const { tracker } = drive(makeStream({ count: 200, drops }));

    expect(tracker.locked).toBe(true);
    expect(tracker.tickIndex).toBe(199); // absolute distance, not a delivery count
    expect(Math.abs(tracker.skewPpm!)).toBeLessThan(20);
  });

  it("projects now onto the ABSOLUTE tick axis (the /dirt/play/at domain)", () => {
    // The engine ran for a while before we connected: indexes start high.
    const stream = makeStream({ count: 64, firstIndex: 500_000 });
    const { tracker, setNow } = drive(stream);

    expect(tracker.locked).toBe(true);
    const last = stream.at(-1)!;
    setNow(last.arrival);
    expect(tracker.audioNowTicksAbsolute()!).toBeCloseTo(last.index, 0);
    setNow(last.arrival + PERIOD_MS); // one period later → one tick further
    expect(tracker.audioNowTicksAbsolute()! - last.index).toBeCloseTo(1, 1);
  });

  it("resyncs on a backward index (engine restart) and re-locks", () => {
    const stream = makeStream({ count: 128, restart: { at: 64 } });
    const { tracker } = drive(stream);

    // Re-locked on the new base: index counts from the restart, not from 0.
    expect(tracker.locked).toBe(true);
    expect(tracker.tickIndex).toBe(63);
    expect(Math.abs(tracker.skewPpm!)).toBeLessThan(20);
  });

  it("reset() clears the lock and re-locks cleanly on the next stream", () => {
    const stream = makeStream({ count: 96 });
    let now = 0;
    const tracker = new TickTracker({ freqHz: FREQ, monotonicNow: () => now });
    for (const { index, arrival } of stream.slice(0, 48)) {
      now = arrival;
      tracker.onTick(index);
    }
    expect(tracker.locked).toBe(true);
    tracker.reset();
    expect(tracker.locked).toBe(false);
    expect(tracker.audioNow()).toBeNull();
    for (const { index, arrival } of stream.slice(48)) {
      now = arrival;
      tracker.onTick(index);
    }
    expect(tracker.locked).toBe(true);
  });

  it("ignores non-finite indexes", () => {
    const { tracker } = drive(makeStream({ count: 40 }));
    const before = tracker.tickIndex;
    tracker.onTick(Number.NaN);
    expect(tracker.tickIndex).toBe(before);
  });
});
