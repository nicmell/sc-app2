/**
 * `UGenInput` helpers over the crate's serde shape:
 * `{ constant: n } | { ugen: i } | { ugenOutput: [i, o] }`.
 * UGen indices refer to positions in the `SynthDef`'s node list, returned
 * by `SynthDef.addUgen` / `addControl`.
 */

import type { UGenInput, UGenInputLike } from "../pkg/scsynthdef_compiler.js";

/** Build a constant input. Convenience constructor. */
export function k(v: number): UGenInput {
  return { constant: v };
}

/** Build a UGen output-0 reference. Convenience constructor. */
export function u(idx: number): UGenInput {
  return { ugen: idx };
}

/** Build a specific UGen output reference. Convenience constructor. */
export function uo(ugenIdx: number, outputIdx: number): UGenInput {
  return { ugenOutput: [ugenIdx, outputIdx] };
}

export function toUGenInput(v: UGenInputLike): UGenInput {
  return typeof v === "number" ? { constant: v } : v;
}

/** The node index an input references — `null` for constants. */
export function ugenIndex(input: UGenInput): number | null {
  if ("ugen" in input) return input.ugen;
  if ("ugenOutput" in input) return input.ugenOutput[0];
  return null;
}

/** The referenced output slot (0 for constants and whole-UGen refs). */
export function outputIndex(input: UGenInput): number {
  return "ugenOutput" in input ? input.ugenOutput[1] : 0;
}
