// Env-shape registry parity with sclang's `Env.<shape>(...).asArray`. The flat
// run is spliced into EnvGen's `envelope` input; getting startLevel /
// numSegments / releaseNode / loopNode / per-segment (level, dur, curveType,
// curveVal) right is what makes each shape play correctly. Also pins the
// modulation path (a ref passes through a level/time slot) and its guard.

import { expect, test } from "vitest";

import { encodeEnv, lookupEnv, u, type EnvArgValue } from "../src/index.js";

/** build → encode → the numeric run (fails if any slot is a ref). */
const nums = (name: string, args: Record<string, EnvArgValue> = {}, opts?: object): number[] =>
  encodeEnv(lookupEnv(name)!.build(args, opts)).map((i) => {
    if (i.tag !== "constant") throw new Error(`expected constant, got ${i.tag}`);
    return i.val;
  });

test("adsr matches Env.adsr(0.01, 0.1, 0.7, 0.3).asArray", () => {
  expect(nums("adsr", { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 })).toEqual([
    0, 3, 2, -99,
    1, 0.01, 5, -4,
    0.7, 0.1, 5, -4,
    0, 0.3, 5, -4,
  ]);
});

test("dadsr prepends a delay segment (releaseNode 3)", () => {
  expect(nums("dadsr", { delay: 0.1, attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 })).toEqual([
    0, 4, 3, -99,
    0, 0.1, 5, -4,
    1, 0.01, 5, -4,
    0.5, 0.1, 5, -4,
    0, 0.3, 5, -4,
  ]);
});

test("asr sustains at segment 1 (direct level)", () => {
  expect(nums("asr", { attack: 0.02, sustain: 0.8, release: 0.4 })).toEqual([
    0, 2, 1, -99,
    0.8, 0.02, 5, -4,
    0, 0.4, 5, -4,
  ]);
});

test("cutoff starts at level, releases to 0 (releaseNode 0, lin)", () => {
  expect(nums("cutoff", { release: 0.1, level: 1 })).toEqual([1, 1, 0, -99, 0, 0.1, 1, 0]);
});

test("perc is a triggered one-shot (no release node)", () => {
  expect(nums("perc", { attack: 0.01, release: 0.5, level: 1 })).toEqual([
    0, 2, -99, -99,
    1, 0.01, 5, -4,
    0, 0.5, 5, -4,
  ]);
});

test("linen is a trapezoid (level held across the sustain segment)", () => {
  expect(nums("linen", { attack: 0.01, sustainTime: 0.5, release: 0.2, level: 1 })).toEqual([
    0, 3, -99, -99,
    1, 0.01, 1, 0,
    1, 0.5, 1, 0,
    0, 0.2, 1, 0,
  ]);
});

test("triangle splits dur in two (lin); sine uses the sine curve", () => {
  expect(nums("triangle", { dur: 1, level: 1 })).toEqual([0, 2, -99, -99, 1, 0.5, 1, 0, 0, 0.5, 1, 0]);
  expect(nums("sine", { dur: 1, level: 1 })).toEqual([0, 2, -99, -99, 1, 0.5, 3, 0, 0, 0.5, 3, 0]);
});

test("new takes explicit levels/times arrays + a shared curve", () => {
  expect(
    nums("new", { levels: [0, 1, 0.5, 0], times: [0.01, 0.1, 0.3] }, { curve: "exp" }),
  ).toEqual([
    0, 3, -99, -99,
    1, 0.01, 2, 0,
    0.5, 0.1, 2, 0,
    0, 0.3, 2, 0,
  ]);
});

test("step holds the first level and uses the step curve", () => {
  expect(nums("step", { levels: [0, 1], times: [1, 0.5] })).toEqual([
    0, 2, -99, -99,
    0, 1, 0, 0,
    1, 0.5, 0, 0,
  ]);
});

test("pairs sorts by time and differences the durations", () => {
  expect(nums("pairs", { pairs: [1, 1, 0, 0, 3, 0] })).toEqual([
    0, 2, -99, -99,
    1, 1, 1, 0,
    0, 2, 1, 0,
  ]);
});

test("xyc carries a per-segment (numeric) curve → type 5 + value", () => {
  expect(nums("xyc", { xyc: [0, 0, -4, 1, 1, -4, 3, 0, -4] })).toEqual([
    0, 2, -99, -99,
    1, 1, 5, -4,
    0, 2, 5, -4,
  ]);
});

test("a modulated time slot passes its ref through", () => {
  const env = lookupEnv("adsr")!.build({ attack: u(3), decay: 0.1, sustain: 0.7, release: 0.3 });
  const run = encodeEnv(env);
  expect(run[5]).toEqual({ tag: "ugen", val: 3 }); // the attack time slot
  expect(run[4]).toEqual({ tag: "constant", val: 1 }); // peak level still constant
});

test("an arithmetic param (sustain) rejects a ref", () => {
  expect(() => lookupEnv("adsr")!.build({ sustain: u(3) })).toThrow(/"sustain" is not modulatable/);
});

test("unknown shape → null", () => {
  expect(lookupEnv("nope")).toBeNull();
});
