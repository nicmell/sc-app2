// The one-way audio-clock tracker, driven by synthetic tick streams that
// reproduce the real signal shape: per-tick phase advance quantized to
// scsynth's 64-sample control blocks (alternating deltas around
// sampleRate/freq), local-clock skew, one-sided delivery jitter, UDP
// drops, and phase-base jumps.
import { describe, expect, it } from "vitest";
import { TickTracker } from "../TickTracker";

const SR = 44_100;
const FREQ = 20;
const RING = 8_192;
const PERIOD_MS = 1000 / FREQ;

interface StreamOptions {
  /** Local-clock rate factor: arrivals spaced period·(1+skew). */
  skew?: number;
  /** One-sided delivery jitter per tick, in ms (added, never subtracted). */
  jitter?: (i: number) => number;
  /** Tick indexes never delivered (UDP loss). */
  drops?: Set<number>;
  /** Phase-base offset applied from tick `at` on (engine restart). */
  baseJump?: { at: number; offset: number };
  count: number;
}

/** Produce (phase, arrivalMs) pairs like the real engine: the tick fires
 *  on the control block nearest i·SR/FREQ, so consecutive phase deltas
 *  alternate (34/35 blocks at 44.1 kHz / 20 Hz). */
function makeStream({ skew = 0, jitter = () => 0, drops, baseJump, count }: StreamOptions) {
  const out: Array<{ phase: number; arrival: number }> = [];
  for (let i = 0; i < count; i++) {
    if (drops?.has(i)) continue;
    let samples = Math.round((i * SR) / FREQ / 64) * 64;
    if (baseJump && i >= baseJump.at) samples += baseJump.offset;
    out.push({
      phase: ((samples % RING) + RING) % RING,
      arrival: 1_000 + i * PERIOD_MS * (1 + skew) + jitter(i),
    });
  }
  return out;
}

function drive(stream: Array<{ phase: number; arrival: number }>) {
  let now = 0;
  const tracker = new TickTracker({
    freqHz: FREQ,
    ringFrames: RING,
    monotonicNow: () => now,
  });
  for (const { phase, arrival } of stream) {
    now = arrival;
    tracker.onTick(phase);
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

  it("derives the index through UDP drops — audioNow never jumps", () => {
    const drops = new Set([40, 41, 42, 80, 120, 121, 122, 123, 124, 125, 126]);
    const stream = makeStream({ count: 200, drops });
    const { tracker } = drive(stream);

    expect(tracker.locked).toBe(true);
    expect(tracker.tickIndex).toBe(199); // absolute, not a delivery count
    expect(Math.abs(tracker.skewPpm!)).toBeLessThan(20);
  });

  it("resyncs on a phase-base jump (engine restart) and re-locks", () => {
    const stream = makeStream({ count: 128, baseJump: { at: 64, offset: 1_111 } });
    const { tracker } = drive(stream);

    // Re-locked on the new base: index counts from the jump, not from 0.
    expect(tracker.locked).toBe(true);
    expect(tracker.tickIndex).toBe(63);
    expect(Math.abs(tracker.skewPpm!)).toBeLessThan(20);
  });

  it("reset() clears the lock; the rate estimate lets it re-lock cleanly", () => {
    const stream = makeStream({ count: 96 });
    let now = 0;
    const tracker = new TickTracker({ freqHz: FREQ, ringFrames: RING, monotonicNow: () => now });
    for (const { phase, arrival } of stream.slice(0, 48)) {
      now = arrival;
      tracker.onTick(phase);
    }
    expect(tracker.locked).toBe(true);
    tracker.reset();
    expect(tracker.locked).toBe(false);
    expect(tracker.audioNow()).toBeNull();
    for (const { phase, arrival } of stream.slice(48)) {
      now = arrival;
      tracker.onTick(phase);
    }
    expect(tracker.locked).toBe(true);
  });

  it("ignores non-finite phases", () => {
    const { tracker } = drive(makeStream({ count: 40 }));
    const before = tracker.tickIndex;
    tracker.onTick(Number.NaN);
    expect(tracker.tickIndex).toBe(before);
  });
});
