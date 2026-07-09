// <sc-control> — a named parameter: a literal `value` or a `_value`
// expression (mutually exclusive; the store seam and the statechange
// propagation live on the ScState/ScElement bases). Enabled when the parent
// is a node (plugin/group/synth); a pure graph input inside synthdefs/ugens —
// where `bind` keeps its OLD meaning, a graph-input REFERENCE (`bind="lfo"`)
// the synthdef collectors read. On nodes `bind` is therefore illegal: state
// expressions are `_value`.
//
// The only control-specific behavior is the OSC side of a value change,
// /n_set on the owning node when it is live, fired from exactly two places:
//   - the WRITE path (`dispatchValue`, user gestures via setValue) — the
//     store echo runs first, so a statechange from an EXTERNAL store write
//     stays UI-only (no echo: two inputs bound to one control converge
//     through the shared key with exactly one /n_set per gesture);
//   - the `runtimeValueChanged` hook for DERIVED controls only — a recompute
//     is not a store write, so the hook is where its /n_set lives (literal
//     controls no-op here, or external writes would echo OSC).
// Values are coerced at this boundary: scsynth controls are floats, so a
// string-valued expression skips the /n_set with a console warning (the UI
// state still updates).

import { isNodeRuntime } from "@/lib/utils/guards";
import { oscClient } from "@/stores/osc";
import type { BaseRuntime, RuntimeContext, StateValue } from "@/types/runtime";
import { failValidation } from "@/sc-elements/internal/validation";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScControl extends ScState {
  validate(): void {
    super.validate();
    // The graph-input role keeps the old exclusivity: the collectors would
    // otherwise silently disagree on which of the two wins.
    if (this.getAttribute("bind") !== null && this.getAttribute("value") !== null) {
      failValidation(this, `"value" and "bind" are mutually exclusive`);
    }
  }

  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    const enabled = ctx.parentNode != null && isNodeRuntime(ctx.parentNode);
    if (enabled && this.getAttribute("bind") !== null) {
      failValidation(this, `"bind" is a synthdef graph input — use "_value" on a node control`);
    }
    return this.stateRuntime(ctx, enabled);
  }

  /** /n_set the owning node — only when it is live (the load-pass initial
   *  lands before the parent's /s_new and rides it via getControls instead;
   *  the ack-window catch-up in ScSynth.load covers the send→/n_go gap).
   *  The owner is the nearest NON-TRANSPARENT ancestor: a control wrapped in
   *  an sc-if under a group still /n_sets the group's node. */
  private sendControl(next: StateValue): void {
    const parent = this.namedScParent;
    if (!(parent && isNodeRuntime(parent) && parent.loaded && parent.nodeId !== 0)) return;
    const value = Number(next);
    if (Number.isNaN(value)) {
      console.warn(
        `<sc-control name="${this.getProp("name") as string}">: non-numeric value ${JSON.stringify(next)} — /n_set skipped`,
      );
      return;
    }
    oscClient.setControl(parent.nodeId, this.getProp("name") as string, value);
  }

  /** The user-gesture write path: store write + /n_set. */
  protected dispatchValue(next: StateValue): boolean {
    if (!super.dispatchValue(next)) return false;
    this.sendControl(next);
    return true;
  }

  /** A DERIVED control's recompute must /n_set too — there is no store write
   *  to carry it. Literal controls no-op (their /n_set is dispatchValue's). */
  protected runtimeValueChanged(name: string, _prev: StateValue | undefined, next: StateValue) {
    if (name === "value" && this.derived) this.sendControl(next);
  }
}
