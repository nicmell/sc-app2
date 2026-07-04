// @vitest-environment node
//
// The step-precision helpers behind knob/slider drags and the inputnumber
// steppers. Regression: the former Math.round(-Math.log10(step)) precision
// under-counted for non-power-of-10 steps (0.5 re-rounded to integers, 0.05 to
// tenths), making odd step multiples unreachable.

import { describe, expect, it } from "vitest";
import { decimalsOf, quantize } from "../number";

describe("decimalsOf", () => {
  it("follows the number's actual decimal places", () => {
    expect(decimalsOf(1)).toBe(0);
    expect(decimalsOf(5)).toBe(0);
    expect(decimalsOf(0.1)).toBe(1);
    expect(decimalsOf(0.5)).toBe(1);
    expect(decimalsOf(0.05)).toBe(2);
    expect(decimalsOf(0.25)).toBe(2);
    expect(decimalsOf(1e-7)).toBe(7);
    expect(decimalsOf(Infinity)).toBe(0);
  });
});

describe("quantize", () => {
  it("keeps every multiple of a non-power-of-10 step reachable", () => {
    // step 0.5 over [0, 2]: 0.5 and 1.5 must survive (formerly rounded to 1/2).
    expect(quantize(0.5, 0, 2, 0.5)).toBe(0.5);
    expect(quantize(1.5, 0, 2, 0.5)).toBe(1.5);
    // step 0.05: odd multiples must survive (formerly snapped to tenths).
    expect(quantize(0.05, 0, 1, 0.05)).toBe(0.05);
    expect(quantize(0.15, 0, 1, 0.05)).toBe(0.15);
    // step 0.25: results stay ON the step grid (formerly 0.25 → 0.3).
    expect(quantize(0.25, 0, 1, 0.25)).toBe(0.25);
    expect(quantize(0.75, 0, 1, 0.25)).toBe(0.75);
  });

  it("snaps to the min-anchored grid and cleans float tails", () => {
    expect(quantize(0.14, 0, 1, 0.05)).toBe(0.15);
    expect(quantize(0.1 + 0.2, 0, 1, 0.1)).toBe(0.3);
    expect(quantize(0.155, 0.005, 1, 0.05)).toBe(0.155);
  });

  it("clamps to [min, max] and tolerates unbounded ranges", () => {
    expect(quantize(2.4, 0, 2, 0.5)).toBe(2);
    expect(quantize(-1, 0, 2, 0.5)).toBe(0);
    expect(quantize(0.5, -Infinity, Infinity, 0.5)).toBe(0.5);
  });

  it("passes raw (clamped) through for a non-positive or non-finite step", () => {
    expect(quantize(0.33, 0, 1, 0)).toBe(0.33);
    expect(quantize(7, 0, 1, Infinity)).toBe(1);
  });
});
