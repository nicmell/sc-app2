// <sc-control> — a named parameter: a literal `value` or a `bind` reference
// (mutually exclusive; declared on the ScState base together with the shared
// validation, the store-key seam, and the bound-state propagation). Enabled
// when the parent is a node (plugin/group/synth); a pure graph input inside
// synthdefs/ugens.
//
// The only control-specific behavior is the OSC side of a write: every
// dispatched value change (a user write via `setValue`, or a bound control's
// recompute) also /n_set's the owning node when it is live. Writes landing in
// the store from elsewhere only refresh the subscribed views — no echo, so
// two inputs bound to one control converge through the shared key with
// exactly one /n_set per gesture.

import { isNodeRuntime } from "@/lib/utils/guards";
import { oscClient } from "@/stores/osc";
import type { RuntimeContext, StateRuntime } from "@/types/runtime";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScControl extends ScState {
  protected resolveRuntime(ctx: RuntimeContext): StateRuntime {
    return this.stateRuntime(ctx, ctx.parentNode != null && isNodeRuntime(ctx.parentNode));
  }

  /** Store write + /n_set on the owning node (when it is live). The initial
   *  load-pass write happens before the parent's /s_new (`loaded` false), so
   *  defaults and computed initials ride the /s_new instead. */
  protected dispatchValue(next: number): boolean {
    if (!super.dispatchValue(next)) return false;
    const parent = this._parentScNode;
    if (parent && isNodeRuntime(parent) && parent.loaded && parent.nodeId !== 0) {
      oscClient.setControl(parent.nodeId, this.name, next);
    }
    return true;
  }
}
