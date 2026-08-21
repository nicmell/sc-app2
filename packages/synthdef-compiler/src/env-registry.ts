/**
 * Envelope-shape registry — one entry per SuperCollider `Env` class-method
 * constructor (https://doc.sccode.org/Classes/Env.html), mirroring how UGens
 * live in `registry.ts` (`lookupUgen`). Each entry declares its parameter
 * names/defaults/arity and a `build(args, opts)` that assembles an `EnvSpec`
 * (levels/times + releaseNode/loopNode), which `encodeEnv` then flattens into
 * EnvGen's `envelope` input run.
 *
 * Modulation: params that map DIRECTLY to an envelope slot (all `times`, and
 * levels that are a single param) may be a UGen/param ref. Params that feed
 * ARITHMETIC (adsr/dadsr `peak`·`sustain`, `+bias`; triangle/sine `dur/2`) must
 * be constants — `build` throws `<shape>: "<name>" is not modulatable`. The
 * coordinate shapes (pairs/xyc) sort by time / difference times, so they are
 * constant-only too.
 */

import type { Curve, EnvSpec } from "./env.js";
import type { UGenInputLike } from "./ugen-input.js";

/** A resolved env argument: a scalar (const or ref) or an array of them. */
export type EnvArgValue = UGenInputLike | UGenInputLike[];

export interface EnvArg {
  name: string;
  default: number;
  /** Comma-list value (levels/times/pairs/xyc), not a single scalar. */
  array?: boolean;
  /** Whether a ref (bind:value) is accepted; false → constant only. */
  modulatable?: boolean;
}

export interface BuildOpts {
  curve?: Curve;
  releaseNode?: number | null;
  loopNode?: number | null;
}

export interface EnvShapeEntry {
  name: string;
  args: readonly EnvArg[];
  releaseNode: number | null;
  loopNode: number | null;
  build(args: Record<string, EnvArgValue>, opts?: BuildOpts): EnvSpec;
}

// ── arg helpers ─────────────────────────────────────────────────────────────

/** A directly-modulatable scalar (constant or ref), with a default. */
function scalar(args: Record<string, EnvArgValue>, name: string, def: number): UGenInputLike {
  const v = args[name];
  return v === undefined ? def : (v as UGenInputLike);
}

/** A constant-only scalar (feeds arithmetic) — throws on a ref. */
function constant(
  shape: string,
  args: Record<string, EnvArgValue>,
  name: string,
  def: number,
): number {
  const v = args[name];
  if (v === undefined) return def;
  if (typeof v !== "number") throw new Error(`${shape}: "${name}" is not modulatable`);
  return v;
}

/** A modulatable array (levels/times of new/step) — refs pass through. */
function likeArray(
  args: Record<string, EnvArgValue>,
  name: string,
  def: number[],
): UGenInputLike[] {
  const v = args[name];
  if (v === undefined) return def;
  return Array.isArray(v) ? v : [v];
}

/** A constant-only numeric array (pairs/xyc — sorted/differenced). */
function numberArray(shape: string, args: Record<string, EnvArgValue>, name: string): number[] {
  const v = args[name];
  if (v === undefined) throw new Error(`${shape}: "${name}" is required`);
  const a = Array.isArray(v) ? v : [v];
  return a.map((x) => {
    if (typeof x !== "number") throw new Error(`${shape}: "${name}" must be constant numbers`);
    return x;
  });
}

/** Cumulative time coords → per-segment durations. */
function diffs(times: number[]): number[] {
  return times.slice(1).map((t, i) => t - times[i]);
}

// ── the registry ────────────────────────────────────────────────────────────

const ENTRIES: EnvShapeEntry[] = [
  {
    name: "adsr",
    releaseNode: 2,
    loopNode: null,
    args: [
      { name: "attack", default: 0.01, modulatable: true },
      { name: "decay", default: 0.3, modulatable: true },
      { name: "sustain", default: 0.5 },
      { name: "release", default: 1, modulatable: true },
      { name: "peak", default: 1 },
      { name: "bias", default: 0 },
    ],
    build(a, o = {}) {
      const peak = constant("adsr", a, "peak", 1);
      const sustain = constant("adsr", a, "sustain", 0.5);
      const bias = constant("adsr", a, "bias", 0);
      return {
        levels: [0 + bias, peak + bias, peak * sustain + bias, 0 + bias],
        times: [scalar(a, "attack", 0.01), scalar(a, "decay", 0.3), scalar(a, "release", 1)],
        curves: o.curve ?? -4,
        releaseNode: 2,
      };
    },
  },
  {
    name: "dadsr",
    releaseNode: 3,
    loopNode: null,
    args: [
      { name: "delay", default: 0.1, modulatable: true },
      { name: "attack", default: 0.01, modulatable: true },
      { name: "decay", default: 0.3, modulatable: true },
      { name: "sustain", default: 0.5 },
      { name: "release", default: 1, modulatable: true },
      { name: "peak", default: 1 },
      { name: "bias", default: 0 },
    ],
    build(a, o = {}) {
      const peak = constant("dadsr", a, "peak", 1);
      const sustain = constant("dadsr", a, "sustain", 0.5);
      const bias = constant("dadsr", a, "bias", 0);
      return {
        levels: [0 + bias, 0 + bias, peak + bias, peak * sustain + bias, 0 + bias],
        times: [
          scalar(a, "delay", 0.1),
          scalar(a, "attack", 0.01),
          scalar(a, "decay", 0.3),
          scalar(a, "release", 1),
        ],
        curves: o.curve ?? -4,
        releaseNode: 3,
      };
    },
  },
  {
    name: "asr",
    releaseNode: 1,
    loopNode: null,
    args: [
      { name: "attack", default: 0.01, modulatable: true },
      { name: "sustain", default: 1, modulatable: true },
      { name: "release", default: 1, modulatable: true },
    ],
    build(a, o = {}) {
      return {
        levels: [0, scalar(a, "sustain", 1), 0],
        times: [scalar(a, "attack", 0.01), scalar(a, "release", 1)],
        curves: o.curve ?? -4,
        releaseNode: 1,
      };
    },
  },
  {
    name: "cutoff",
    releaseNode: 0,
    loopNode: null,
    args: [
      { name: "release", default: 0.1, modulatable: true },
      { name: "level", default: 1, modulatable: true },
    ],
    build(a, o = {}) {
      return {
        levels: [scalar(a, "level", 1), 0],
        times: [scalar(a, "release", 0.1)],
        curves: o.curve ?? "lin",
        releaseNode: 0,
      };
    },
  },
  {
    name: "perc",
    releaseNode: null,
    loopNode: null,
    args: [
      { name: "attack", default: 0.01, modulatable: true },
      { name: "release", default: 1, modulatable: true },
      { name: "level", default: 1, modulatable: true },
    ],
    build(a, o = {}) {
      return {
        levels: [0, scalar(a, "level", 1), 0],
        times: [scalar(a, "attack", 0.01), scalar(a, "release", 1)],
        curves: o.curve ?? -4,
      };
    },
  },
  {
    name: "linen",
    releaseNode: null,
    loopNode: null,
    args: [
      { name: "attack", default: 0.01, modulatable: true },
      { name: "sustainTime", default: 1, modulatable: true },
      { name: "release", default: 1, modulatable: true },
      { name: "level", default: 1, modulatable: true },
    ],
    build(a, o = {}) {
      const level = scalar(a, "level", 1);
      return {
        levels: [0, level, level, 0],
        times: [scalar(a, "attack", 0.01), scalar(a, "sustainTime", 1), scalar(a, "release", 1)],
        curves: o.curve ?? "lin",
      };
    },
  },
  {
    name: "triangle",
    releaseNode: null,
    loopNode: null,
    args: [
      { name: "dur", default: 1 },
      { name: "level", default: 1, modulatable: true },
    ],
    build(a, o = {}) {
      const half = constant("triangle", a, "dur", 1) / 2;
      return {
        levels: [0, scalar(a, "level", 1), 0],
        times: [half, half],
        curves: o.curve ?? "lin",
      };
    },
  },
  {
    name: "sine",
    releaseNode: null,
    loopNode: null,
    args: [
      { name: "dur", default: 1 },
      { name: "level", default: 1, modulatable: true },
    ],
    build(a, o = {}) {
      const half = constant("sine", a, "dur", 1) / 2;
      return {
        levels: [0, scalar(a, "level", 1), 0],
        times: [half, half],
        curves: o.curve ?? "sin",
      };
    },
  },
  {
    name: "new",
    releaseNode: null,
    loopNode: null,
    args: [
      { name: "levels", default: 0, array: true, modulatable: true },
      { name: "times", default: 1, array: true, modulatable: true },
    ],
    build(a, o = {}) {
      return {
        levels: likeArray(a, "levels", [0, 1, 0]),
        times: likeArray(a, "times", [1, 1]),
        curves: o.curve ?? "lin",
        releaseNode: o.releaseNode ?? null,
        loopNode: o.loopNode ?? null,
      };
    },
  },
  {
    name: "step",
    releaseNode: null,
    loopNode: null,
    args: [
      { name: "levels", default: 0, array: true, modulatable: true },
      { name: "times", default: 1, array: true, modulatable: true },
    ],
    build(a, o = {}) {
      // Env.step: the first level is held from t0 — build levels = [l0, ...l].
      const levels = likeArray(a, "levels", [0, 1]);
      const times = likeArray(a, "times", [1, 1]);
      if (levels.length !== times.length) {
        throw new Error(`step: "levels" and "times" must be equal length`);
      }
      return {
        levels: [levels[0], ...levels],
        times,
        curves: o.curve ?? "step",
        releaseNode: o.releaseNode ?? null,
        loopNode: o.loopNode ?? null,
      };
    },
  },
  {
    name: "pairs",
    releaseNode: null,
    loopNode: null,
    args: [{ name: "pairs", default: 0, array: true }],
    build(a, o = {}) {
      // Flat [t0,l0, t1,l1, …] → sorted by time → levels + difference-times.
      const flat = numberArray("pairs", a, "pairs");
      if (flat.length % 2 !== 0) throw new Error(`pairs: expects [time, level] pairs`);
      const pts: [number, number][] = [];
      for (let i = 0; i < flat.length; i += 2) pts.push([flat[i], flat[i + 1]]);
      pts.sort((x, y) => x[0] - y[0]);
      return {
        levels: pts.map((p) => p[1]),
        times: diffs(pts.map((p) => p[0])),
        curves: o.curve ?? "lin",
      };
    },
  },
  {
    name: "xyc",
    releaseNode: null,
    loopNode: null,
    args: [{ name: "xyc", default: 0, array: true }],
    build(a) {
      // Flat [t0,l0,c0, t1,l1,c1, …] → sorted by time → levels + diff-times +
      // per-segment (numeric) curves.
      const flat = numberArray("xyc", a, "xyc");
      if (flat.length % 3 !== 0) throw new Error(`xyc: expects [time, level, curve] triplets`);
      const pts: [number, number, number][] = [];
      for (let i = 0; i < flat.length; i += 3) pts.push([flat[i], flat[i + 1], flat[i + 2]]);
      pts.sort((x, y) => x[0] - y[0]);
      return {
        levels: pts.map((p) => p[1]),
        times: diffs(pts.map((p) => p[0])),
        curves: pts.slice(1).map((p) => p[2]), // one curve per segment
      };
    },
  },
];

const BY_NAME = new Map(ENTRIES.map((e) => [e.name, e]));

export const ENV_SHAPES: readonly EnvShapeEntry[] = ENTRIES;

/** Look up an envelope shape by its `type` name. `null` if unknown. */
export function lookupEnv(name: string): EnvShapeEntry | null {
  return BY_NAME.get(name) ?? null;
}
