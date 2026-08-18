// <sc-var> — a state variable: like sc-control (the props/validation/store
// seam/propagation live on the ScState/ScElement bases) but always enabled
// and never sent over OSC — a literal var is a store-backed key writes reach
// through the base's plain store dispatch (and may hold a STRING: its `value`
// is a scalar); a derived var (`bind:value`) computes its `_state` from its
// targets (no store key) and is read-only.
//
// A var must be declared ON A NODE (plugin/group/synth): its store key is its
// named-ancestor path, and a path-transparent container (sc-if, sc-select,
// sc-radio-group — no path segment of their own) would let a same-named var
// silently share an outer var's key. Controls encode the same rule in their
// enablement; vars enforce it as a parse error.

import { isNodeRuntime } from "@/lib/utils/guards";
import type { RuntimeContext, BaseRuntime } from "@/types/runtime";
import { failValidation } from "@/sc-elements/internal/validation";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScVar extends ScState {
  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    if (!ctx.parentNode || !isNodeRuntime(ctx.parentNode)) {
      failValidation(this, "must be declared on a node");
    }
    return this.stateRuntime(ctx, true);
  }
}
