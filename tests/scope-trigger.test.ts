// The <sc-scope> software trigger (lib/scope/trigger.ts) — a pure function,
// tested directly: edge detection with hysteresis arming, slope direction,
// level offsets, the searchEnd bound, and the no-trigger cases that drive
// the auto/normal fallbacks.

import { describe, expect, it } from "vitest";
import { findTriggerOffset, TRIGGER_HYSTERESIS } from "@/lib/scope/trigger";

/** `count` samples of a sine starting at `phase` (radians). */
function sine(count: number, cyclesPerWindow: number, amp = 1, phase = 0): Float32Array {
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    out[i] = amp * Math.sin(phase + (2 * Math.PI * cyclesPerWindow * i) / count);
  }
  return out;
}

describe("findTriggerOffset", () => {
  it("finds the first rising zero-crossing after arming below the hysteresis margin", () => {
    // Starts at -amp (already armed), rises through 0 at the quarter cycle.
    const lane = sine(1024, 4, 0.5, -Math.PI / 2);
    const offset = findTriggerOffset(lane, 256, 0, true);
    expect(offset).not.toBeNull();
    expect(lane[offset!]).toBeGreaterThanOrEqual(0);
    expect(lane[offset! - 1]).toBeLessThan(0);
    // The quarter cycle of 4-in-1024 is 64 samples.
    expect(offset).toBe(64);
  });

  it("skips an initial above-level run until the signal arms (no false fire at sample 0)", () => {
    // Starts at +amp: already past the level, but NOT a crossing — the
    // trigger must wait for the dip below -hysteresis and fire on the way up.
    const lane = sine(1024, 4, 0.5, Math.PI / 2);
    const offset = findTriggerOffset(lane, 512, 0, true);
    expect(offset).not.toBeNull();
    expect(offset).toBeGreaterThan(128); // past the first half cycle (the dip)
    expect(lane[offset!]).toBeGreaterThanOrEqual(0);
    expect(lane[offset! - 1]).toBeLessThan(0);
  });

  it("mirrors for a falling slope", () => {
    const lane = sine(1024, 4, 0.5, Math.PI / 2); // starts at +amp, falls
    const offset = findTriggerOffset(lane, 256, 0, false);
    expect(offset).not.toBeNull();
    expect(lane[offset!]).toBeLessThanOrEqual(0);
    expect(lane[offset! - 1]).toBeGreaterThan(0);
    // 64 mathematically; sin(π)'s float dust (≈1e-16 > 0) may defer one sample.
    expect([64, 65]).toContain(offset);
  });

  it("respects a non-zero level", () => {
    const lane = sine(1024, 4, 0.5, -Math.PI / 2);
    const offset = findTriggerOffset(lane, 256, 0.25, true);
    expect(offset).not.toBeNull();
    expect(lane[offset!]).toBeGreaterThanOrEqual(0.25);
    expect(lane[offset! - 1]).toBeLessThan(0.25);
  });

  it("returns null when no crossing fires within searchEnd", () => {
    // One cycle per 1024 samples starting at the trough: the rising
    // zero-crossing is at sample 256 — outside a 128-sample headroom.
    const lane = sine(1024, 1, 0.5, -Math.PI / 2);
    expect(findTriggerOffset(lane, 128, 0, true)).toBeNull();
    expect(findTriggerOffset(lane, 256, 0, true)).toBe(256);
  });

  it("returns null on silence, DC, and sub-hysteresis ripple", () => {
    expect(findTriggerOffset(new Float32Array(1024), 256, 0, true)).toBeNull();
    expect(findTriggerOffset(new Float32Array(1024).fill(0.7), 256, 0, true)).toBeNull();
    // Ripple smaller than the arming margin never arms the trigger.
    const ripple = sine(1024, 16, TRIGGER_HYSTERESIS / 2);
    expect(findTriggerOffset(ripple, 256, 0, true)).toBeNull();
  });

  it("never fires past searchEnd even when the lane continues", () => {
    const lane = sine(1024, 4, 0.5, -Math.PI / 2);
    // Crossing at 64; with searchEnd 32 nothing in range qualifies.
    expect(findTriggerOffset(lane, 32, 0, true)).toBeNull();
  });
});
