// <sc-var> — a state variable: like sc-control (the props/validation/store
// seam/propagation live on the ScState/ScElement bases) but always LIVE
// and never sent over OSC — a literal var is a store-backed key writes reach
// through the base's plain store dispatch (and may hold a STRING: its `value`
// is a non-strict vector); a derived var (`bind:value`) computes its `_state` from its
// targets (no store key) and is read-only.
//
// A var must be declared ON A NODE (plugin/group/synth): its store key is its
// named-ancestor path, and a path-transparent container (sc-if, sc-select,
// sc-radio-group — no path segment of their own) would let a same-named var
// silently share an outer var's key. A control off a node is legal
// synthdef-plane data; vars enforce the rule as a parse error.

import { isNodeRuntime } from "@/lib/utils/guards";
import type { RuntimeContext } from "@/types/runtime";
import { failValidation } from "@/sc-elements/internal/engine/validation";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScVar extends ScState {
  resolveRuntime(ctx: RuntimeContext): void {
    // A POSITIONAL rule, so it lives in the runtime step: a var on a
    // non-node level (inside a synthdef) has no store path to key under —
    // the runtime half of the gate (the spec content model is static).
    if (!ctx.parentNode || !isNodeRuntime(ctx.parentNode)) {
      failValidation(this, "must be declared on a node");
    }
    super.resolveRuntime(ctx);
  }
}
