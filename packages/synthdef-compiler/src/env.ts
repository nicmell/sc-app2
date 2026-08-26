/**
 * Envelope encoding for EnvGen. `Env.adsr(...)` in sclang is not a UGen — it
 * flattens to a run of inputs spliced into EnvGen's input list (at the tail,
 * after the scalar gate/levelScale/levelBias/timeScale/doneAction args). This
 * module produces that flat run; the shape matches sclang's `Env.asArray`:
 *
 *   [ startLevel, numSegments, releaseNode, loopNode,
 *     level₁, dur₁, curveType₁, curveVal₁,     // one 4-tuple per segment
 *     level₂, dur₂, curveType₂, curveVal₂,
 *     … ]
 *
 * `releaseNode`/`loopNode` are the 0-based segment indices SC uses for the
 * gate hold-point and loop-back; a nil node encodes as -99. A segment's curve
 * is either a symbolic shape (mapped through CURVE_SHAPES, curveVal 0) or a
 * number (`curveType` 5 = "custom", the number as `curveVal`).
 *
 * Level and duration slots are `UGenInputLike` — a constant OR a UGen/param
 * reference — so envelope times/levels can be MODULATED by other signals
 * (the structural slots and curve encodings stay constants). The per-shape
 * constructors live in `env-registry.ts`.
 */

import { k, toUGenInput, type UGenInput, type UGenInputLike } from "./ugen-input.js";

/** Env curve shape name → the scsynth curve-type integer. A numeric curve is
 *  type 5 ("custom") with the number carried as the curve value. */
const CURVE_SHAPES: Record<string, number> = {
  step: 0,
  linear: 1,
  lin: 1,
  exponential: 2,
  exp: 2,
  sine: 3,
  sin: 3,
  welch: 4,
  wel: 4,
  squared: 6,
  sqr: 6,
  cubed: 7,
  cub: 7,
  hold: 8,
};

export type Curve = number | string;

const NO_NODE = -99;

function curveType(curve: Curve): number {
  if (typeof curve === "number") return 5; // "custom"
  const n = CURVE_SHAPES[curve];
  if (n === undefined) throw new Error(`Unknown envelope curve: "${curve}"`);
  return n;
}

function curveValue(curve: Curve): number {
  return typeof curve === "number" ? curve : 0;
}

/** A generic envelope: breakpoint levels, per-segment durations, and curves
 *  (one shared curve, or one per segment). `levels.length === times.length + 1`.
 *  Levels/times may be constants or refs (modulation). */
export interface EnvSpec {
  levels: UGenInputLike[];
  times: UGenInputLike[];
  /** One curve applied to every segment, or one per segment. Default "lin". */
  curves?: Curve | Curve[];
  /** 0-based segment index the gate sustains at (nil → no sustain). */
  releaseNode?: number | null;
  /** 0-based segment index to loop back to (nil → no loop). */
  loopNode?: number | null;
}

/** Flatten an EnvSpec into the EnvGen envelope input run (sclang Env.asArray),
 *  as UGenInputs: structural slots + curve encodings are constants; level and
 *  duration slots pass their (possibly-ref) input through. */
export function encodeEnv(env: EnvSpec): UGenInput[] {
  const segments = env.times.length;
  if (env.levels.length !== segments + 1) {
    throw new Error(`Envelope levels (${env.levels.length}) must be times (${segments}) + 1`);
  }
  const out: UGenInput[] = [
    toUGenInput(env.levels[0]),
    k(segments),
    k(env.releaseNode ?? NO_NODE),
    k(env.loopNode ?? NO_NODE),
  ];
  for (let i = 0; i < segments; i++) {
    const curve = Array.isArray(env.curves) ? (env.curves[i] ?? "lin") : (env.curves ?? "lin");
    out.push(
      toUGenInput(env.levels[i + 1]),
      toUGenInput(env.times[i]),
      k(curveType(curve)),
      k(curveValue(curve)),
    );
  }
  return out;
}
