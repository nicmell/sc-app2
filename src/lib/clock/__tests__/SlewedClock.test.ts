// The rate-disciplined timebase: monotonic by construction, rate slewing
// toward its target at a bounded slope — the properties Cyclist's getTime
// depends on, pinned against a DI'd monotonic clock.
import { describe, expect, it } from "vitest";
import { SlewedClock } from "../SlewedClock";

function makeClock() {
  let monoMs = 0;
  const clock = new SlewedClock({ monotonicNow: () => monoMs });
  return { clock, advance: (ms: number) => (monoMs += ms) };
}

/** Average rate of `clock` over the next `ms` of real time. */
function rateOver(clock: SlewedClock, advance: (ms: number) => void, ms: number): number {
  const t0 = clock.time();
  advance(ms);
  return ((clock.time() - t0) * 1000) / ms;
}

describe("SlewedClock", () => {
  it("tracks real time 1:1 at the default rate", () => {
    const { clock, advance } = makeClock();
    expect(rateOver(clock, advance, 1_000)).toBeCloseTo(1, 9);
  });

  it("slews toward a new target at a bounded slope, monotone throughout", () => {
    const { clock, advance } = makeClock();
    clock.setTargetRate(1 + 400e-6);

    // 50 ppm/s cap: after 1 s the rate has moved at most ~50 ppm.
    expect(rateOver(clock, advance, 1_000)).toBeLessThan(1 + 60e-6);

    // Fine-grained reads stay strictly monotone through the whole ramp.
    let last = clock.time();
    for (let i = 0; i < 200; i++) {
      advance(50);
      const t = clock.time();
      expect(t).toBeGreaterThan(last);
      last = t;
    }
    // 10 s elapsed — the 8 s ramp is over; the rate sits ON target.
    expect(rateOver(clock, advance, 1_000)).toBeCloseTo(1 + 400e-6, 7);
  });

  it("re-aims continuously when the target flips sign", () => {
    const { clock, advance } = makeClock();
    clock.setTargetRate(1 + 400e-6);
    advance(10_000);
    clock.time(); // settle on +400 ppm
    clock.setTargetRate(1 - 400e-6);

    // No step: right after the flip the rate is still ≈ +400 ppm…
    expect(rateOver(clock, advance, 100)).toBeGreaterThan(1 + 350e-6);
    // …and after the 16 s ramp it sits on the new target.
    advance(20_000);
    clock.time();
    expect(rateOver(clock, advance, 1_000)).toBeCloseTo(1 - 400e-6, 7);
  });

  it("clamps absurd targets to ±1000 ppm", () => {
    const { clock, advance } = makeClock();
    clock.setTargetRate(2); // +1e6 ppm — a measurement error, not a crystal
    advance(60_000); // any ramp long over
    clock.time();
    expect(rateOver(clock, advance, 1_000)).toBeCloseTo(1 + 1000e-6, 7);
  });

  it("stays monotone and slope-correct across one sparse read", () => {
    const { clock, advance } = makeClock();
    const t0 = clock.time();
    clock.setTargetRate(1 + 400e-6);
    advance(100_000); // one huge gap: 8 s ramp + 92 s flat on target
    const t1 = clock.time();
    expect(t1).toBeGreaterThan(t0);
    // Exact piecewise integral: ramp average (200 ppm over 8 s) + target.
    const expected = (8 * (1 + 200e-6) + 92 * (1 + 400e-6)) * 1000;
    expect((t1 - t0) * 1000).toBeCloseTo(expected, 3);
  });
});
