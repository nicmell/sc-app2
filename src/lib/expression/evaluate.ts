// The RUNTIME evaluator (moved from lib/utils/expression.ts): evalExpr over
// live state values with SC's multichannel expansion. Function calls
// evaluate through the functions.ts registry and are NaN-GUARDED, never
// throwing at runtime (the codebase contract — bad values warn once and the
// caller keeps its previous value): a failed call makes the WHOLE expression
// `undefined`, which `#computeRuntime`'s existing undefined semantics absorb.

import type { Expr } from "./ast";
import { lookupFunction, type Value } from "./functions";

/** One scalar element of a Value (arrays never nest). */
type Scalar = number | string;

/** SC's multichannel-expansion zip: scalars broadcast; the shorter array
 *  cycles (wrapAt). */
function zipWrap(l: Value, r: Value, apply: (a: Scalar, b: Scalar) => Scalar): Value {
  if (!Array.isArray(l) && !Array.isArray(r)) return apply(l, r);
  const la = Array.isArray(l) ? l : [l];
  const ra = Array.isArray(r) ? r : [r];
  const n = Math.max(la.length, ra.length);
  return Array.from({ length: n }, (_, i) =>
    Number(apply(la[i % la.length], ra[i % ra.length])),
  );
}

type BinaryOp = Extract<Expr, { type: "binary" }>["op"];

function applyBinary(op: BinaryOp, l: Scalar, r: Scalar): Scalar {
  switch (op) {
    // `+` concatenates when either side is a string; the rest coerce
    // numerically (strings become NaN — guarded at the OSC boundary).
    case "+":
      return typeof l === "string" || typeof r === "string"
        ? String(l) + String(r)
        : Number(l) + Number(r);
    case "-":
      return Number(l) - Number(r);
    case "*":
      return Number(l) * Number(r);
    case "/":
      return Number(r) !== 0 ? Number(l) / Number(r) : 0;
    // Comparisons evaluate to 1/0 (the truthiness sc-if & co. consume);
    // two strings compare lexicographically (plain JS relationals).
    case ">":
      return (l as number) > (r as number) ? 1 : 0;
    case "<":
      return (l as number) < (r as number) ? 1 : 0;
    case ">=":
      return (l as number) >= (r as number) ? 1 : 0;
    case "<=":
      return (l as number) <= (r as number) ? 1 : 0;
    case "==":
      return l === r ? 1 : 0;
    default: // "!="
      return l !== r ? 1 : 0;
  }
}

/** Once-per-message warning bookkeeping for failed runtime calls. */
const warned = new Set<string>();
function warnOnce(message: string): void {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

/** Evaluate with SC's multichannel expansion: operators over arrays apply
 *  element-wise with the shorter operand cycling; scalars broadcast; unary
 *  maps; an array ternary COND selects element-wise across both (possibly
 *  broadcast) branches. Array results are numeric. Returns `undefined` when
 *  a function call fails on the current values (warned once) — callers keep
 *  their previous value. */
export function evalExpr(
  expr: Expr,
  values: Record<string, Value>,
): Value | undefined {
  switch (expr.type) {
    case "number":
    case "string":
      return expr.value;
    case "var":
      return values[expr.name] ?? 0;
    case "call": {
      const args: Value[] = [];
      for (const argExpr of expr.args) {
        const v = evalExpr(argExpr, values);
        if (v === undefined) return undefined; // a nested call already failed
        args.push(v);
      }
      try {
        return lookupFunction(expr.name)!.evalConst(args);
      } catch (err) {
        warnOnce(`bind expression: ${err instanceof Error ? err.message : String(err)}`);
        return undefined;
      }
    }
    case "unary": {
      const v = evalExpr(expr.expr, values);
      if (v === undefined) return undefined;
      return Array.isArray(v) ? v.map((x) => -Number(x)) : -Number(v);
    }
    case "ternary": {
      const cond = evalExpr(expr.cond, values);
      if (cond === undefined) return undefined;
      if (Array.isArray(cond)) {
        const then = evalExpr(expr.then, values);
        const other = evalExpr(expr.else, values);
        if (then === undefined || other === undefined) return undefined;
        const pick = (branch: Value, i: number): Scalar =>
          Array.isArray(branch) ? branch[i % branch.length] : branch;
        return cond.map((c, i) => Number(c ? pick(then, i) : pick(other, i)));
      }
      return cond ? evalExpr(expr.then, values) : evalExpr(expr.else, values);
    }
    case "binary": {
      const l = evalExpr(expr.left, values);
      const r = evalExpr(expr.right, values);
      if (l === undefined || r === undefined) return undefined;
      return zipWrap(l, r, (a, b) => applyBinary(expr.op, a, b));
    }
  }
}
