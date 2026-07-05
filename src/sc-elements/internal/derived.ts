// The derived-value machinery shared by every reader of the state graph:
// bound sc-control/sc-var (ScState — recompute → dispatchValue) and the
// read-only expression visuals (ScVisual: sc-display/sc-if — recompute →
// `_value`). A derived value is the bind targets' current store values pushed
// through the parsed expression (a plain single-path bind is the identity);
// it re-computes on every target change — push propagation over the reactive
// store. The bind-order constraint makes the target graph a DAG resolved in
// DOM order, so propagation terminates (diamond dependencies can transiently
// dispatch once per intermediate before converging — accepted).

import { evalExpr } from "@/lib/utils/expression";
import type { Expr } from "@/types/runtime";
import type { ScState } from "@/sc-elements/internal/sc-state";

/** The derived value right now — `undefined` when any target key is gone:
 *  that's the plugin map being dropped, and recomputing would resurrect it
 *  (the load-bearing guard every store subscriber carries). */
export function computeDerived(
  targets: Record<string, ScState>,
  expression: Expr | undefined,
): number | undefined {
  const values: Record<string, number> = {};
  for (const [path, target] of Object.entries(targets)) {
    const v = target.selectValue().get();
    if (v === undefined) return undefined;
    values[path] = v;
  }
  if (expression) return evalExpr(expression, values);
  const [first] = Object.values(values);
  return first;
}

/** Fire `onValue` with the current derived value, then on every recompute a
 *  target change triggers. Returns the combined unsubscribe. */
export function observeDerived(
  targets: Record<string, ScState>,
  expression: Expr | undefined,
  onValue: (value: number) => void,
): () => void {
  const recompute = () => {
    const v = computeDerived(targets, expression);
    if (v !== undefined) onValue(v);
  };
  recompute();
  const offs = Object.values(targets).map((target) => target.selectValue().subscribe(recompute));
  return () => {
    for (const off of offs) off();
  };
}
