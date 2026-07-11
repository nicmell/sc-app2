/**
 * Envelope encoding for EnvGen. `Env.adsr(...)` in sclang is not a UGen — it
 * flattens to a run of numbers spliced into EnvGen's input list (at the tail,
 * after the scalar gate/levelScale/levelBias/timeScale/doneAction args). This
 * module produces that flat array; the shape of the encoding matches sclang's
 * `Env.asArray`:
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
 */

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
 *  (one shared curve, or one per segment). `levels.length === times.length + 1`. */
export interface EnvSpec {
  levels: number[];
  times: number[];
  /** One curve applied to every segment, or one per segment. Default "lin". */
  curves?: Curve | Curve[];
  /** 0-based segment index the gate sustains at (nil → no sustain). */
  releaseNode?: number | null;
  /** 0-based segment index to loop back to (nil → no loop). */
  loopNode?: number | null;
}

/** Flatten an EnvSpec into the EnvGen envelope input run (sclang Env.asArray). */
export function encodeEnv(env: EnvSpec): number[] {
  const segments = env.times.length;
  if (env.levels.length !== segments + 1) {
    throw new Error(
      `Envelope levels (${env.levels.length}) must be times (${segments}) + 1`,
    );
  }
  const out: number[] = [
    env.levels[0],
    segments,
    env.releaseNode ?? NO_NODE,
    env.loopNode ?? NO_NODE,
  ];
  for (let i = 0; i < segments; i++) {
    const curve = Array.isArray(env.curves) ? (env.curves[i] ?? "lin") : (env.curves ?? "lin");
    out.push(env.levels[i + 1], env.times[i], curveType(curve), curveValue(curve));
  }
  return out;
}

/** Env.adsr — attack to peak, decay to peak·sustain, sustain (releaseNode 2),
 *  release to 0 on gate-off. */
export function envAdsr(o: {
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  peak?: number;
  curve?: Curve;
  bias?: number;
}): EnvSpec {
  const { attack = 0.01, decay = 0.3, sustain = 0.5, release = 1, peak = 1, curve = -4, bias = 0 } =
    o;
  return {
    levels: [0, peak, peak * sustain, 0].map((v) => v + bias),
    times: [attack, decay, release],
    curves: curve,
    releaseNode: 2,
  };
}

/** Env.perc — a fixed one-shot (attack then release), gate acts as a trigger;
 *  no sustain node. */
export function envPerc(o: {
  attack?: number;
  release?: number;
  level?: number;
  curve?: Curve;
}): EnvSpec {
  const { attack = 0.01, release = 1, level = 1, curve = -4 } = o;
  return { levels: [0, level, 0], times: [attack, release], curves: curve };
}

/** Env.asr — attack, sustain (releaseNode 1), release on gate-off. */
export function envAsr(o: {
  attack?: number;
  sustain?: number;
  release?: number;
  curve?: Curve;
}): EnvSpec {
  const { attack = 0.01, sustain = 1, release = 1, curve = -4 } = o;
  return { levels: [0, sustain, 0], times: [attack, release], curves: curve, releaseNode: 1 };
}
