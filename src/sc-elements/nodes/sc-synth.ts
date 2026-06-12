// <sc-synth> — a synth instance of an sc-synthdef (referenced by `bind`),
// with sc-control children as its parameters. The load pass /s_new's it into
// the nearest ancestor group (the plugin group) — sequentially AFTER the
// bound synthdef, which the bind-order constraint places earlier in the DOM.

import { property } from "lit/decorators.js";
import { ADDR_N_GO, AddToTail, NodeEvent, sNew } from "@sc-app/server-commands";
import { isSynthDefRuntime } from "@/lib/utils/guards";
import { oscClient } from "@/stores/osc";
import type { NodeRuntime, RuntimeContext } from "@/types/runtime";
import { requireProp, resolveNode } from "@/sc-elements/internal/validation";
import { ScNode } from "@/sc-elements/internal/sc-node";

export class ScSynth extends ScNode {
  @property() accessor name = "";
  @property() accessor bind = "";

  validate(): void {
    requireProp(this, "name", this.name);
  }

  protected resolveRuntime(ctx: RuntimeContext): NodeRuntime {
    if (this.bind) {
      const target = resolveNode(this, ctx, [this.bind]);
      // The bind must name an actual synthdef — any other named element
      // (a group, another synth) is the same error.
      if (!target || !isSynthDefRuntime(target)) {
        throw new Error(`<sc-synth bind="${this.bind}">: does not match any <sc-synthdef>`);
      }
    }
    return super.resolveRuntime(ctx);
  }

  /** Children first (the sc-controls seed/sync their store values), then
   *  /s_new with those values baked in as control pairs. Created running —
   *  `run="false"` (/n_run) arrives with the sc-run step. */
  async load(): Promise<void> {
    await super.load();
    if (!this.isConnected || !this.bind) return;
    const nodeId = oscClient.nextNodeId();
    const reply = oscClient.once(ADDR_N_GO, (m) => NodeEvent.nodeId(m) === nodeId);
    oscClient.send(sNew(this.bind, nodeId, AddToTail, this.targetGroupId, this.getControls()));
    await reply;
    this.nodeId = nodeId;
    this.loaded = true;
  }

  /** The node itself dies with the plugin group's gFreeAll — no per-synth
   *  nFree (it would double-free into /fail noise). */
  unload(): void {
    super.unload();
    this.nodeId = 0;
    this.loaded = false;
  }
}
