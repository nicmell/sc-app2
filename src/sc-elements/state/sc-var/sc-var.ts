// <sc-var> — a state variable: like sc-control (the props/validation/store
// seam/propagation live on the ScState base) but always enabled and never
// sent over OSC — a write is the base's plain store dispatch, and bound vars
// recompute through the shared propagation.

import type { RuntimeContext, StateRuntime } from "@/types/runtime";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScVar extends ScState {
  protected resolveRuntime(ctx: RuntimeContext): StateRuntime {
    return this.stateRuntime(ctx, true);
  }
}
