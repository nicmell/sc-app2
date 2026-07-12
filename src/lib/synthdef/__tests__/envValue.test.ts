// The envelope codec: flat Env.asArray runs ⇄ the editor's breakpoint model.
// Decode is garbage-tolerant (clamped numSegments, unknown curves → lin);
// encode zero-pads to the bound array's width with the TRUE numSegments in
// the header (sclang's Env.newClear + setn model).

import { describe, expect, it } from "vitest";
import { decodeEnvArray, encodeEnvArray, envPeak, type EnvBreakpoints } from "@/lib/synthdef/envValue";

const ADSR_FLAT = [0, 3, 2, -99, 1, 0.01, 5, -4, 0.7, 0.1, 5, -4, 0, 0.3, 5, -4];

describe("envelope codec", () => {
  it("decodes header + tuples into breakpoints (flags from the node indices)", () => {
    const bp = decodeEnvArray(ADSR_FLAT);
    expect(bp.start).toBe(0);
    expect(bp.segments).toHaveLength(3);
    expect(bp.segments[0]).toMatchObject({ to: 1, time: 0.01, curve: -4 });
    expect(bp.segments[2].release).toBe(true);
    expect(bp.segments[0].release).toBeUndefined();
  });

  it("decodes symbolic curve types and falls back to lin on unknowns", () => {
    const flat = [0, 2, -99, -99, 1, 0.1, 3, 0, 0, 0.2, 99, 0];
    const bp = decodeEnvArray(flat);
    expect(bp.segments[0].curve).toBe("sin");
    expect(bp.segments[1].curve).toBe("lin"); // unknown type 99
  });

  it("clamps a lying numSegments header to what the array holds", () => {
    const flat = [0, 9, -99, -99, 1, 0.1, 1, 0]; // claims 9, holds 1
    expect(decodeEnvArray(flat).segments).toHaveLength(1);
    expect(decodeEnvArray([0.5]).segments).toHaveLength(0); // not an env at all
  });

  it("encodes back zero-padded to the width with the true header", () => {
    const bp = decodeEnvArray(ADSR_FLAT);
    const flat = encodeEnvArray(bp, 64);
    expect(flat).toHaveLength(64);
    expect(flat.slice(0, ADSR_FLAT.length)).toEqual(ADSR_FLAT);
    expect(flat.slice(ADSR_FLAT.length)).toEqual(new Array(64 - ADSR_FLAT.length).fill(0));
  });

  it("round-trips decode ∘ encode", () => {
    const bp = decodeEnvArray(ADSR_FLAT);
    expect(decodeEnvArray(encodeEnvArray(bp, 64))).toEqual(bp);
  });

  it("rejects breakpoints over the width's capacity", () => {
    const wide: EnvBreakpoints = {
      start: 0,
      segments: Array.from({ length: 4 }, () => ({ to: 1, time: 0.1 })),
    };
    expect(() => encodeEnvArray(wide, 4 + 3 * 4)).toThrow("exceed the array's capacity");
  });

  it("rejects a width under the 4-slot header (would pad negatively)", () => {
    const empty: EnvBreakpoints = { start: 0, segments: [] };
    expect(() => encodeEnvArray(empty, 3)).toThrow("cannot hold the 4-slot Env.asArray header");
  });

  it("envPeak: max |level| over start + REAL targets, floored at 0.001", () => {
    // 2 segments (targets 0.5 and -0.8); the zero padding is NOT a level.
    const flat = [0.2, 2, 1, -99, 0.5, 0.1, 5, -4, -0.8, 0.3, 5, -4, 0, 0, 0, 0];
    expect(envPeak(flat)).toBeCloseTo(0.8, 6);
    expect(envPeak([0, 1, 0, -99, 0, 0.1, 5, -4])).toBe(0.001); // flat zero → floor
    expect(envPeak([])).toBe(0.001);
  });
});
