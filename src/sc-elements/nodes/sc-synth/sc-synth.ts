// <sc-synth> — a synth instance of an sc-synthdef (referenced by `synthdef`),
// with sc-control children as its parameters. The load pass /s_new's it into
// the nearest ancestor group (the plugin group) — sequentially AFTER the
// bound synthdef, which the bind-order constraint places earlier in the DOM.

import { oscClient } from "@/stores/osc";
import { isControlRuntime } from "@/lib/utils/guards";
import type { NodeRuntime, RuntimeContext } from "@/types/runtime";
import { resolveSynthDefRef } from "@/sc-elements/internal/validation";
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

  protected resolveRuntime(ctx: RuntimeContext): NodeRuntime {
    this.defElement = resolveSynthDefRef(this, ctx, this.getProp("synthdef") as string);
    return super.resolveRuntime(ctx);
  }

  /** Read the enabled control children once in DOM order. Scalar controls
   *  become /s_new pairs; array controls are sent as indexed pairs. A string
   *  scalar is skipped with the same warning the old scalar collector used. */
  private getControlSnapshots(): {
    scalars: Array<[string, number]>;
    arrays: Array<{ name: string; values: readonly number[] }>;
  } {
    const scalars: Array<[string, number]> = [];
    const arrays: Array<{ name: string; values: readonly number[] }> = [];
    for (const child of this._scChildren ?? []) {
      if (!isControlRuntime(child) || !child.enabled) continue;
      const name = child.getProp("name") as string;
      const state = child._state ?? child.getProp("value");
      if (Array.isArray(state)) {
        arrays.push({ name, values: state });
        continue;
      }
      const value = Number(state ?? 0);
      if (Number.isNaN(value)) {
        console.warn(`<sc-control name="${name}">: non-numeric value — control pair skipped`);
        continue;
      }
      scalars.push([name, value]);
    }
    return { scalars, arrays };
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
    const initial = this.getControlSnapshots();
    const snapshot: Record<string, number> = Object.fromEntries(initial.scalars);
    // ARRAY controls ride the /s_new as consecutive index/value pairs from
    // each array's base param index. Instance controls only — a def array
    // param without one keeps its compiled defaults (share live state
    // explicitly via bind:value, like every other control).
    const arraySnapshot: Record<string, readonly number[]> = Object.fromEntries(
      initial.arrays.map(({ name, values }) => [name, values]),
    );
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
    const current = this.getControlSnapshots();
    for (const [name, value] of current.scalars) {
      if (!Object.is(snapshot[name], value)) {
        oscClient.setControl(this.nodeId, name, value);
      }
    }
    // Same for arrays (immutable per edit, so a reference change IS a drift).
    for (const { name, values } of current.arrays) {
      if (arraySnapshot[name] !== values) oscClient.setControln(this.nodeId, name, values);
    }
  }
}
