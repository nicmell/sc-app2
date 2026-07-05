// <sc-control> — a named parameter: a literal `value` or a `bind` expression
// (mutually exclusive; declared on the ScState/ScDerived bases together with
// the shared validation, the store seam, and the statechange propagation).
// Enabled when the parent is a node (plugin/group/synth); a pure graph input
// inside synthdefs/ugens.
//
// The only control-specific behavior is the OSC side of a value change,
// /n_set on the owning node when it is live, fired from exactly two places:
//   - the WRITE path (`dispatchValue`, user gestures via setValue) — the
//     store echo runs first, so a statechange from an EXTERNAL store write
//     stays UI-only (no echo: two inputs bound to one control converge
//     through the shared key with exactly one /n_set per gesture);
//   - the `stateChanged` hook for BOUND controls only — a recompute is not a
//     store write, so the hook is where its /n_set lives (literal controls
//     no-op here, or external writes would echo OSC).

import { isNodeRuntime } from "@/lib/utils/guards";
import { oscClient } from "@/stores/osc";
import type { RuntimeContext, DerivedRuntime } from "@/types/runtime";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScControl extends ScState {
  protected resolveRuntime(ctx: RuntimeContext): DerivedRuntime {
    return this.stateRuntime(ctx, ctx.parentNode != null && isNodeRuntime(ctx.parentNode));
  }

  /** /n_set the owning node — only when it is live (the load-pass initial
   *  lands before the parent's /s_new and rides it via getControls instead;
   *  the ack-window catch-up in ScSynth.load covers the send→/n_go gap). */
  private sendControl(next: number): void {
    const parent = this._parentScNode;
    if (parent && isNodeRuntime(parent) && parent.loaded && parent.nodeId !== 0) {
      oscClient.setControl(parent.nodeId, this.name, next);
    }
  }

  /** The user-gesture write path: store write + /n_set. */
  protected dispatchValue(next: number): boolean {
    if (!super.dispatchValue(next)) return false;
    this.sendControl(next);
    return true;
  }

  /** A BOUND control's recompute must /n_set too — there is no store write
   *  to carry it. Literal controls no-op (their /n_set is dispatchValue's). */
  protected stateChanged(_prev: number | undefined, next: number): void {
    if (this.targets) this.sendControl(next);
  }
}
