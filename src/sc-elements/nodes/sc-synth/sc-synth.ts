// <sc-synth> — a synth instance of an sc-synthdef (referenced by `synthdef`),
// with sc-control children as its parameters. The load pass /s_new's it into
// the nearest ancestor group (the plugin group) — sequentially AFTER the
// bound synthdef, which the bind-order constraint places earlier in the DOM.

import { isSynthDefRuntime } from "@/lib/utils/guards";
import { oscClient } from "@/stores/osc";
import type { NodeRuntime, RuntimeContext } from "@/types/runtime";
import { requireName, resolveNode } from "@/sc-elements/internal/validation";
import { ScNode } from "@/sc-elements/internal/sc-node";

export class ScSynth extends ScNode {
  validate(): void {
    requireName(this);
  }

  protected resolveRuntime(ctx: RuntimeContext): NodeRuntime {
    const synthdef = this.getProp("synthdef") as string;
    const target = resolveNode(this, ctx, [synthdef]);
    // The reference must name an actual synthdef — any other named element
    // (a group, another synth) is the same error.
    if (!target || !isSynthDefRuntime(target)) {
      throw new Error(`<sc-synth synthdef="${synthdef}">: does not match any <sc-synthdef>`);
    }
    return super.resolveRuntime(ctx);
  }

  /** Children first (the sc-controls seed/sync their store values), then
   *  /s_new with those values baked in as control pairs. */
  async load(): Promise<void> {
    const epoch = this._rootScNode?.loadEpoch ?? 0;
    await super.load();
    const synthdef = this.getProp("synthdef") as string;
    if (!this.isConnected || this.loaded) return;
    // The pass was invalidated while the children loaded — don't create a
    // node whose target group is gone.
    if ((this._rootScNode?.loadEpoch ?? 0) !== epoch) return;
    const snapshot = this.getControls();
    const nodeId = await oscClient.createSynth(synthdef, this.targetGroupId, snapshot);
    // The pass may have been invalidated while /s_new was awaiting /n_go.
    // Never adopt an id from a disconnected or superseded session.
    if (!this.isConnected || (this._rootScNode?.loadEpoch ?? 0) !== epoch) return;
    this.nodeId = nodeId;
    this.loaded = true;
    // Writes landing between the /s_new send and its /n_go ack were baked
    // stale AND skipped the /n_set (dispatch gates on `loaded`) — catch the
    // node up on any control that drifted from the snapshot meanwhile.
    for (const [name, value] of Object.entries(this.getControls())) {
      if (!Object.is(snapshot[name], value)) {
        oscClient.setControl(this.nodeId, name, value);
      }
    }
  }

  /** The node itself dies with the plugin group's gFreeAll — no per-synth
   *  nFree (it would double-free into /fail noise). */
  unload(): void {
    super.unload();
    this.nodeId = 0;
    this.loaded = false;
  }
}
