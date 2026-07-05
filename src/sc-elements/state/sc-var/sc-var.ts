// <sc-var> — a state variable: like sc-control (the props/validation/store
// seam/propagation live on the ScState/ScDerived bases) but always enabled
// and never sent over OSC — a literal var is a store-backed key writes reach
// through the base's plain store dispatch; a bound var derives its `_state`
// from its targets (no store key) and is read-only.
//
// A var must be declared ON A NODE (plugin/group/synth): its store key is its
// named-ancestor path, and a path-transparent container (sc-if, sc-select,
// sc-radio-group — no path segment of their own) would let a same-named var
// silently share an outer var's key. Controls encode the same rule in their
// enablement; vars enforce it as a parse error.

import { isNodeRuntime } from "@/lib/utils/guards";
import type { RuntimeContext, DerivedRuntime } from "@/types/runtime";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScVar extends ScState {
  protected resolveRuntime(ctx: RuntimeContext): DerivedRuntime {
    if (!ctx.parentNode || !isNodeRuntime(ctx.parentNode)) {
      throw new Error(`<sc-var name="${this.name}">: must be declared on a node`);
    }
    return this.stateRuntime(ctx, true);
  }
}
