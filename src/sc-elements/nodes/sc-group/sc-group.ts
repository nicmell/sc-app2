// <sc-group> — a named container node: its synths/groups live in a scsynth
// group of their own, nested inside the nearest loaded ancestor group (the
// plugin group, or an outer sc-group). The load pass creates the group node
// FIRST — the inverse of sc-synth's children-first order — so the children's
// `targetGroupId` walk finds it live; group-level enabled controls /n_set the
// group node (scsynth applies a group /n_set to every node inside — the
// server-side replacement for the old app's name-based propagation).
//
// unload() resets the flags only: the node subtree dies with the plugin
// group's wholesale /g_freeAll (the sc-synth precedent — a per-group free
// would only add double-free /fail noise).

import { property } from "lit/decorators.js";
import { oscClient } from "@/stores/osc";
import { requireName } from "@/sc-elements/internal/validation";
import { ScNode } from "@/sc-elements/internal/sc-node";

export class ScGroup extends ScNode {
  @property() accessor name = "";

  validate(): void {
    requireName(this, this.name);
  }

  /** Own node first (children target it), then the children in DOM order. */
  async load(): Promise<void> {
    const epoch = this._rootScNode?.loadEpoch ?? 0;
    if (this.isConnected && !this.loaded) {
      const nodeId = await oscClient.createGroup(this.targetGroupId);
      // The pass was invalidated while the /n_go was pending — don't adopt a
      // node the new connection knows nothing about.
      if ((this._rootScNode?.loadEpoch ?? 0) !== epoch) return;
      this.nodeId = nodeId;
      this.loaded = true;
    }
    await super.load();
  }

  unload(): void {
    super.unload();
    this.nodeId = 0;
    this.loaded = false;
  }
}
