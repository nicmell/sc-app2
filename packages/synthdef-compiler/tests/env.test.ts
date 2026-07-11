// Env encoding parity with sclang's `Env.asArray`. The flat run is spliced
// into EnvGen's `envelope` input; getting startLevel / numSegments /
// releaseNode / loopNode / per-segment (level, dur, curveType, curveVal) right
// is what makes the envelope play correctly.

import { expect, test } from "vitest";

import { encodeEnv, envAdsr, envAsr, envPerc } from "../src/index.js";

test("envAdsr matches Env.adsr(0.01, 0.1, 0.7, 0.3).asArray", () => {
  // levels [0, peak, peak*sustain, 0], times [a, d, r], releaseNode 2, no loop,
  // curve -4 → (type 5 = custom, value -4) on every segment.
  expect(encodeEnv(envAdsr({ attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 }))).toEqual([
    0, 3, 2, -99,
    1, 0.01, 5, -4,
    0.7, 0.1, 5, -4,
    0, 0.3, 5, -4,
  ]);
});

test("envPerc has no release node (a triggered one-shot)", () => {
  expect(encodeEnv(envPerc({ attack: 0.01, release: 0.5, level: 1 }))).toEqual([
    0, 2, -99, -99,
    1, 0.01, 5, -4,
    0, 0.5, 5, -4,
  ]);
});

test("envAsr sustains at segment 1", () => {
  expect(encodeEnv(envAsr({ attack: 0.02, sustain: 0.8, release: 0.4 }))).toEqual([
    0, 2, 1, -99,
    0.8, 0.02, 5, -4,
    0, 0.4, 5, -4,
  ]);
});

test("symbolic curves map to their shape number with curveVal 0", () => {
  const env = encodeEnv({ levels: [0, 1, 0], times: [0.1, 0.2], curves: ["lin", "exp"] });
  // header + seg0 (lin=1, val 0) + seg1 (exp=2, val 0)
  expect(env).toEqual([0, 2, -99, -99, 1, 0.1, 1, 0, 0, 0.2, 2, 0]);
});

test("rejects mismatched levels/times", () => {
  expect(() => encodeEnv({ levels: [0, 1], times: [0.1, 0.2] })).toThrow(/levels/);
});
