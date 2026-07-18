// The expression FUNCTION registry: SC's envelope constructors, bridged from
// @sc-app/synthdef-compiler's env-registry (which owns the shapes, arg
// defaults, releaseNode/curve conventions), plus the generic `pad()` array
// tool. Two evaluation planes per function:
//   evalConst — client-side, over runtime values: throws on bad input (the
//               runtime evaluator catches + NaN-guards; the STATIC value
//               path lets the throw surface as a parse failure)
//   lower     — synthdef-graph lowering: args are raw numbers or UGenInput
//               refs; refs pass through into the env-registry's modulatable
//               slots (constant-only slots throw the registry's honest
//               "<shape>: <arg> is not modulatable"). Deliberately
//               builder-free (constants only via k()) — lib/expression must
//               never import lib/synthdef.

import {
  ENV_SHAPES,
  k,
  type EnvArgValue,
  type EnvShapeEntry,
  type UGenInput,
} from "@sc-app/synthdef-compiler";
import type { Expr } from "./ast";

/** One scalar-or-array runtime value (mirrors StateValue, kept local so the
 *  type edge to @/types stays one-directional). */
export type Value = number | string | number[];

/** A graph-lowered argument: a raw number (unwrapped constant), a UGen/param
 *  ref, or an array of those (a nested call's result). */
export type LoweredArg = number | UGenInput | (number | UGenInput)[];

export interface ExprFunction {
  name: string;
  minArgs: number;
  /** Infinity = rest-args (pairs/xyc take a flat variadic list). */
  maxArgs: number;
  /** Static arity-independent result length (env runs are fixed per shape) —
   *  lets pad() verify capacity at parse time. Undefined = arg-dependent. */
  staticLength?: (argCount: number) => number;
  /** Parse-time validation over the raw arg AST (arity already checked) —
   *  everything statically checkable fails HERE, not at first evaluation. */
  validateStatic?: (args: readonly Expr[]) => void;
  evalConst(args: Value[]): number[];
  lower(args: LoweredArg[]): UGenInput[];
}

/** encodeEnv output → plain numbers (all-constant runs only). */
const constRun = (fn: string, run: UGenInput[]): number[] =>
  run.map((input) => {
    if (!("constant" in input)) throw new Error(`${fn}(): non-constant envelope slot`);
    return input.constant;
  });

/** An env shape's flat-run length: header 4 + 4 per segment. */
const envRunLength = (segments: number) => 4 + segments * 4;

// ── envelope shapes, generated from the compiler's registry ────────────────

/** Segment count per scalar-arg shape (times.length is fixed per shape). */
const SEGMENTS: Record<string, number> = {
  adsr: 3,
  dadsr: 4,
  asr: 2,
  cutoff: 1,
  perc: 2,
  linen: 3,
  triangle: 2,
  sine: 2,
};

function scalarShape(entry: EnvShapeEntry): ExprFunction {
  const argNames = entry.args.map((a) => a.name);
  const mapArgs = (args: readonly (Value | LoweredArg)[]): Record<string, EnvArgValue> => {
    const out: Record<string, EnvArgValue> = {};
    args.forEach((v, i) => {
      if (Array.isArray(v)) {
        throw new Error(`${entry.name}(): "${argNames[i]}" must be a scalar (got an array)`);
      }
      if (typeof v === "string") {
        throw new Error(`${entry.name}(): "${argNames[i]}" must be a number (got "${v}")`);
      }
      out[argNames[i]] = v;
    });
    return out;
  };
  return {
    name: entry.name,
    minArgs: 0, // every registry arg has a default
    maxArgs: entry.args.length,
    staticLength: () => envRunLength(SEGMENTS[entry.name]),
    evalConst: (args) => constRun(entry.name, entry.buildRun(mapArgs(args))),
    lower: (args) => entry.buildRun(mapArgs(args)),
  };
}

/** pairs/xyc: ONE array arg, fed by the flat rest-args ("t0, l0, t1, l1, …").
 *  Constant-only in the registry — the graph plane inherits that. */
function restShape(entry: EnvShapeEntry, tuple: number): ExprFunction {
  const argName = entry.args[0].name;
  const mapArgs = (args: readonly (Value | LoweredArg)[]): Record<string, EnvArgValue> => ({
    [argName]: args.map((v, i) => {
      if (typeof v !== "number") {
        throw new Error(`${entry.name}(): argument ${i + 1} must be a constant number`);
      }
      return v;
    }),
  });
  return {
    name: entry.name,
    minArgs: tuple * 2, // at least two points — one segment
    maxArgs: Infinity,
    // N points → N-1 segments (the registry sorts + differences the times).
    staticLength: (argCount) => envRunLength(argCount / tuple - 1),
    evalConst: (args) => constRun(entry.name, entry.buildRun(mapArgs(args))),
    lower: (args) => entry.buildRun(mapArgs(args)),
  };
}

// ── pad ─────────────────────────────────────────────────────────────────────

const PAD_MIN = `pad(): width must be a positive integer`;

const pad: ExprFunction = {
  name: "pad",
  minArgs: 2,
  maxArgs: 2,
  // When the padded value is a CALL (static run length) and the width a
  // literal, the capacity check runs at parse — a too-small pad() in markup
  // never survives to evaluation.
  validateStatic: (args) => {
    const [arr, width] = args;
    if (arr.type !== "call" || width.type !== "number") return;
    const inner = lookupFunction(arr.name);
    const length = inner?.staticLength?.(arr.args.length);
    if (length !== undefined && width.value < length) {
      throw new Error(`pad(): width ${width.value} cannot hold ${length} values (never truncates)`);
    }
  },
  evalConst: ([arr, width]) => {
    if (!Array.isArray(arr)) {
      throw new Error(
        `pad(): the first argument must be an array (an envelope call or array state)`,
      );
    }
    const w = Math.floor(Number(width));
    if (typeof width !== "number" || !(w > 0)) throw new Error(PAD_MIN);
    if (w < arr.length) {
      throw new Error(`pad(): width ${w} cannot hold ${arr.length} values (never truncates)`);
    }
    return [...arr, ...new Array<number>(w - arr.length).fill(0)];
  },
  lower: ([arr, width]) => {
    if (!Array.isArray(arr)) {
      throw new Error(`pad(): the first argument must be an array (an envelope call)`);
    }
    const w = Math.floor(Number(width));
    if (typeof width !== "number" || !(w > 0)) throw new Error(PAD_MIN);
    if (w < arr.length) {
      throw new Error(`pad(): width ${w} cannot hold ${arr.length} values (never truncates)`);
    }
    const inputs = arr.map((v) => (typeof v === "number" ? k(v) : v));
    return [...inputs, ...new Array<number>(w - arr.length).fill(0).map(() => k(0))];
  },
};

// ── the registry ────────────────────────────────────────────────────────────

/** Env shapes whose args cannot map onto a flat positional list (two array
 *  args) — named here so the parser can reject them with a pointed message
 *  instead of "unknown function". */
export const UNSUPPORTED_FUNCTIONS: Record<string, string> = {
  new: `env shape "new" takes level/time ARRAYS — not expressible as a flat call`,
  step: `env shape "step" takes level/time ARRAYS — not expressible as a flat call`,
};

const FUNCTIONS = new Map<string, ExprFunction>();
for (const entry of ENV_SHAPES) {
  const arrayArgs = entry.args.filter((a) => a.array).length;
  if (arrayArgs === 0) FUNCTIONS.set(entry.name, scalarShape(entry));
  else if (arrayArgs === 1 && entry.args.length === 1) {
    FUNCTIONS.set(entry.name, restShape(entry, entry.name === "xyc" ? 3 : 2));
  }
  // two-array shapes (new/step) stay out — see UNSUPPORTED_FUNCTIONS
}
FUNCTIONS.set(pad.name, pad);

export function lookupFunction(name: string): ExprFunction | undefined {
  return FUNCTIONS.get(name);
}

export function isKnownFunctionHead(name: string): boolean {
  return FUNCTIONS.has(name) || name in UNSUPPORTED_FUNCTIONS;
}
