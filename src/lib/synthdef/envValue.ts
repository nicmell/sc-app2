// The envelope CODEC — the only place (besides EnvGen itself) that knows a
// flat numeric array can be an `Env.asArray` encoding:
//   [ start, numSegments, releaseNode, loopNode,
//     to₁, time₁, curveType₁, curveVal₁, … ]
// The engine treats envelopes as plain number[] state; <sc-envelope>
// decodes for its breakpoint canvas and encodes fresh arrays on commit
// (zero-padded to the bound array's width — the def's control-array size —
// with the true numSegments in the header: sclang's Env.newClear + setn
// model). Decoding is garbage-tolerant: numSegments clamps to what the
// array actually holds, unknown curve types fall back to lin.

import { encodeEnvRun } from "@sc-app/synthdef-compiler";

/** The editor's structured model of one segment: ramp TO a level over TIME
 *  along a CURVE; `release`/`loop` flag the releaseNode/loopNode segment. */
export interface EnvSegment {
  to: number;
  time: number;
  curve?: number | string;
  release?: boolean;
  loop?: boolean;
}

export interface EnvBreakpoints {
  start: number;
  segments: EnvSegment[];
}

/** scsynth curve-type integer → the editor's curve value (symbolic name or
 *  the numeric curvature for type 5). Mirrors the package CURVE_SHAPES. */
const CURVE_NAMES: Record<number, string> = {
  0: "step",
  1: "lin",
  2: "exp",
  3: "sin",
  4: "wel",
  6: "sqr",
  7: "cub",
  8: "hold",
};

/** Decode a flat Env.asArray run into breakpoints. Tolerant of a padded or
 *  malformed array: the segment count is the header's claim clamped to what
 *  the array holds; a non-env array decodes to zero segments. */
export function decodeEnvArray(flat: readonly number[]): EnvBreakpoints {
  if (flat.length < 4) return { start: flat[0] ?? 0, segments: [] };
  const capacity = Math.floor((flat.length - 4) / 4);
  const count = Math.max(0, Math.min(flat[1] | 0, capacity));
  const releaseNode = flat[2];
  const loopNode = flat[3];
  const segments: EnvSegment[] = [];
  for (let i = 0; i < count; i++) {
    const base = 4 + i * 4;
    const type = flat[base + 2] | 0;
    segments.push({
      to: flat[base],
      time: flat[base + 1],
      curve: type === 5 ? flat[base + 3] : (CURVE_NAMES[type] ?? "lin"),
      release: releaseNode === i || undefined,
      loop: loopNode === i || undefined,
    });
  }
  return { start: flat[0], segments };
}

/** Encode breakpoints back to the flat run, zero-padded to `width` (the
 *  bound array's length — the def's control-array size). Throws when the
 *  segments exceed the width's capacity. */
export function encodeEnvArray(value: EnvBreakpoints, width: number): number[] {
  if (width < 4) {
    throw new Error(`encodeEnvArray: width ${width} cannot hold the 4-slot Env.asArray header`);
  }
  const capacity = Math.floor((width - 4) / 4);
  if (value.segments.length > capacity) {
    throw new Error(
      `encodeEnvArray: ${value.segments.length} segments exceed the array's capacity (${capacity})`,
    );
  }
  const releaseNode = value.segments.findIndex((s) => s.release);
  const loopNode = value.segments.findIndex((s) => s.loop);
  const run = encodeEnvRun(
    [value.start, ...value.segments.map((s) => s.to)],
    value.segments.map((s) => s.time),
    value.segments.map((s) => s.curve ?? "lin"),
    releaseNode >= 0 ? releaseNode : undefined,
    loopNode >= 0 ? loopNode : undefined,
  ).map((input) => {
    if (!("constant" in input)) throw new Error("encodeEnvArray: non-constant envelope slot");
    return input.constant;
  });
  return [...run, ...new Array<number>(width - run.length).fill(0)];
}
