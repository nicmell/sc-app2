// <sc-control> — a named parameter: a literal `value` or a `bind:value`
// expression (mutually exclusive; the store seam and the statechange
// propagation live on the ScState/ScElement bases). Enabled when the parent
// is a node (plugin/group/synth); a pure graph input inside ugens — where
// the SAME spelling means a graph-input REFERENCE (`bind:value="lfo"`) the
// synthdef collectors consume raw.
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
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScControl extends ScState {
  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    return this.stateRuntime(ctx, ctx.parentNode != null && isNodeRuntime(ctx.parentNode));
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
