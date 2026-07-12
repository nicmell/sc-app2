// <sc-synth> — a synth instance of an sc-synthdef (referenced by `synthdef`),
// with sc-control children as its parameters. The load pass /s_new's it into
// the nearest ancestor group (the plugin group) — sequentially AFTER the
// bound synthdef, which the bind-order constraint places earlier in the DOM.

import { isSynthDefRuntime } from "@/lib/utils/guards";
import { oscClient } from "@/stores/osc";
import type { NodeRuntime, RuntimeContext } from "@/types/runtime";
import { requireName, resolveNode } from "@/sc-elements/internal/validation";
import { ScNode } from "@/sc-elements/internal/sc-node";
import type { ScSynthDef } from "@/sc-elements/synthdef/sc-synthdef";

export class ScSynth extends ScNode {
  /** The resolved definition element (set at parse). NOT for defaults —
   *  scsynth applies the def's own param defaults; only instance controls
   *  ride the /s_new. Kept for array controls only: they bake in as
   *  consecutive INTEGER-index pairs (the encoder has no OSC `[ ]` array
   *  tags, and a post-create /n_setn would race the first control block),
   *  and the index is the def's param layout — `paramIndexOf`. */
  private defElement?: ScSynthDef;

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
    this.defElement = target;
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
    // ARRAY controls ride the /s_new as consecutive index/value pairs from
    // each array's base param index. Instance controls only — a def array
    // param without one keeps its compiled defaults (share live state
    // explicitly via bind:value, like every other control).
    const arraySnapshot: Record<string, readonly number[]> = this.getArrayControls();
    const arrays: Array<{ index: number; values: readonly number[] }> = [];
    for (const [name, values] of Object.entries(arraySnapshot)) {
      const index = this.defElement?.paramIndexOf(name);
      if (index !== undefined) arrays.push({ index, values });
    }
    const nodeId = await oscClient.createSynth(synthdef, this.targetGroupId, snapshot, arrays);
    // The pass may have been invalidated while /s_new was awaiting /n_go.
    // Never adopt an id from a disconnected or superseded session.
    if (!this.isConnected || (this._rootScNode?.loadEpoch ?? 0) !== epoch) return;
    this.nodeId = nodeId;
    this.loaded = true;
    // NOT a resend: the /s_new args are the SEND-TIME snapshot, and /n_go is
    // awaited asynchronously — a user gesture landing in that window wrote
    // the store but SKIPPED its /n_set (dispatch gates on `loaded`, false
    // until here). Diff live state against the snapshot and send only the
    // drift — the common case sends nothing.
    for (const [name, value] of Object.entries(this.getControls())) {
      if (!Object.is(snapshot[name], value)) {
        oscClient.setControl(this.nodeId, name, value);
      }
    }
    // Same for arrays (immutable per edit, so a reference change IS a drift).
    for (const [name, values] of Object.entries(this.getArrayControls())) {
      if (arraySnapshot[name] !== values) oscClient.setControln(this.nodeId, name, values);
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
