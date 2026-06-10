// <sc-var> — a state variable: like sc-control (the props/validation/runtime
// live on the ScState base) but always enabled and never sent over OSC.
// Stub: reactive value propagation arrives with the state migration step.

import type { RuntimeContext, ScVarProps, StateRuntime } from "@/types/runtime";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScVar extends ScState implements ScVarProps {
  protected resolveRuntime(ctx: RuntimeContext): StateRuntime {
    return this.stateRuntime(ctx, true);
  }
}
