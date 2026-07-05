// <sc-var> — a state variable: like sc-control (the props/validation/store
// seam/propagation live on the ScState base) but always enabled and never
// sent over OSC — a write is the base's plain store dispatch, and bound vars
// recompute through the shared propagation.
//
// A var must be declared ON A NODE (plugin/group/synth): its store key is its
// named-ancestor path, and a path-transparent container (sc-if, sc-select,
// sc-radio-group — no path segment of their own) would let a same-named var
// silently share an outer var's key. Controls encode the same rule in their
// enablement; vars enforce it as a parse error.

import { isNodeRuntime } from "@/lib/utils/guards";
import type { RuntimeContext, StateRuntime } from "@/types/runtime";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScVar extends ScState {
  protected resolveRuntime(ctx: RuntimeContext): StateRuntime {
    if (!ctx.parentNode || !isNodeRuntime(ctx.parentNode)) {
      throw new Error(`<sc-var name="${this.name}">: must be declared on a node`);
    }
    return this.stateRuntime(ctx, true);
  }
}
