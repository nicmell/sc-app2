// <sc-control> — a named parameter: a literal `value` or a `bind` reference
// (mutually exclusive; declared on the ScState base together with the shared
// validation and runtime). Enabled when the parent is a node (plugin/group/
// synth); a pure graph input inside synthdefs/ugens. /n_set propagation
// arrives with the controls migration step.

import { isNodeRuntime } from "@/lib/utils/guards";
import type { RuntimeContext, ScControlProps, StateRuntime } from "@/types/runtime";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScControl extends ScState implements ScControlProps {
  protected resolveRuntime(ctx: RuntimeContext): StateRuntime {
    return this.stateRuntime(ctx, ctx.parentNode != null && isNodeRuntime(ctx.parentNode));
  }
}
