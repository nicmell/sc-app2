// Base for the node-owning elements (sc-plugin / sc-group / sc-synth): the
// shared `run` attribute plus the node runtime values — `nodeId` (the scsynth
// node, assigned when it goes live) and `loaded`. Nodes open a level:
// resolveRuntime recurses via ScParent's processChildren; sc-synth adds its
// synthdef reference on top.

import { isNodeRuntime } from "@/lib/utils/guards";
import { oscClient } from "@/stores/osc";
import { ScParent } from "@/sc-elements/internal/sc-parent";

export abstract class ScNode extends ScParent {
  /** The scsynth node id — 0 until the node goes live. */
  nodeId = 0;
  loaded = false;

  /** The scsynth group this node's create targets: the nearest LOADED node
   *  ancestor — the enclosing sc-group's node, or the plugin group (the walk
   *  skips transparent containers and not-yet-live nodes naturally). */
  protected get targetGroupId(): number {
    for (let el = this._parentScNode; el; el = el._parentScNode) {
      if (isNodeRuntime(el) && el.nodeId !== 0) return el.nodeId;
    }
    // A LOAD-pass invariant (groups load before their contents), not a parse
    // error — deliberately outside the `<tag>: message` validation shape.
    throw new Error(`no loaded ancestor group for <${this.tagName.toLowerCase()}> at load time`);
  }

  /** Pause (false) / resume (true) the live node (/n_run); a no-op until the
   *  node is live. The `run` attribute itself is not yet honored at load. */
  setRunning(running: boolean): void {
    if (!this.loaded || this.nodeId === 0) return;
    oscClient.setNodeRun(this.nodeId, running ? 1 : 0);
  }

  /** Undo the node load after all descendants have unloaded. */
  unload(): void {
    super.unload();
    this.nodeId = 0;
    this.loaded = false;
  }
}
