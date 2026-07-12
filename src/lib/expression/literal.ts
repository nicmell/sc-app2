// The STRICT constant evaluator for STATIC `value` attributes:
// `value="pad(adsr(0.02, 0.15, 0.6, 0.3), 36)"` on sc-var/sc-control. Unlike
// the runtime evaluator this THROWS — a static value evaluates once at
// parse, where loud failure is correct (a typo'd adsr() must not silently
// become a string). Sits above parser + functions (imports both), keeping
// the module graph acyclic.

import type { Expr } from "./ast";
import { isKnownFunctionHead, lookupFunction } from "./functions";
import { parseBind } from "./parser";

/** Head-check: a call to a KNOWN function? An unknown head keeps the
 *  existing string semantics (a var value "sine wave" or "foo(bar)" stays a
 *  string — the name collision is only claimed for registry heads). */
const CALL_HEAD = /^([A-Za-z_]\w*)\(/;

/** Static attributes are stable strings — results cache forever; callers
 *  get a fresh copy per read (arrays stay immutable-by-identity for the
 *  Object.is guards and store seeding). Failures are NOT cached: they throw
 *  every time, and validation runs once. */
const cache = new Map<string, number[] | null>();

/** Evaluate a call-shaped static value into number[]. Returns null when the
 *  string is not a known-function call; THROWS on a known head with invalid
 *  arguments. */
export function tryEvalCallLiteral(raw: string): number[] | null {
  const cached = cache.get(raw);
  if (cached !== undefined) return cached ? [...cached] : null;
  const head = CALL_HEAD.exec(raw.trim());
  if (!head || !isKnownFunctionHead(head[1])) {
    cache.set(raw, null);
    return null;
  }
  const parsed = parseBind(raw.trim());
  if (!parsed.expression) throw new Error(`"${raw}": expected a function call`);
  if (parsed.paths.length > 0) {
    throw new Error(
      `"${raw}": a static value cannot reference state ("${parsed.paths[0]}") — use bind:value`,
    );
  }
  const result = evalConstExpr(raw, parsed.expression);
  if (!Array.isArray(result)) {
    throw new Error(`"${raw}": a static call value must produce an array`);
  }
  cache.set(raw, result);
  return [...result];
}

/** Strict constant fold over the AST subset legal in a static value:
 *  numbers, calls, unary minus, arithmetic. Anything else throws. */
function evalConstExpr(raw: string, expr: Expr): number | number[] {
  switch (expr.type) {
    case "number":
      return expr.value;
    case "call":
      return lookupFunction(expr.name)!.evalConst(expr.args.map((a) => evalConstExpr(raw, a)));
    case "unary": {
      const v = evalConstExpr(raw, expr.expr);
      if (typeof v !== "number") throw new Error(`"${raw}": unary minus needs a number`);
      return -v;
    }
    case "binary": {
      const l = evalConstExpr(raw, expr.left);
      const r = evalConstExpr(raw, expr.right);
      if (typeof l !== "number" || typeof r !== "number") {
        throw new Error(`"${raw}": arithmetic over arrays is not allowed in a static value`);
      }
      switch (expr.op) {
        case "+":
          return l + r;
        case "-":
          return l - r;
        case "*":
          return l * r;
        case "/":
          return r !== 0 ? l / r : 0;
        default:
          throw new Error(`"${raw}": "${expr.op}" is not allowed in a static value`);
      }
    }
    default:
      throw new Error(
        `"${raw}": only numbers, arithmetic, and calls are allowed in a static value`,
      );
  }
}
