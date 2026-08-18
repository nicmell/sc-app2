// Base for the node-owning elements (sc-plugin / sc-group / sc-synth): the
// shared `run` attribute plus the node runtime values — `nodeId` (the scsynth
// node, assigned when it goes live) and `loaded`. The default runtime parses
// the children and resolves the node core; subclasses extend it (sc-synth
// checks its synthdef bind first, sc-plugin wraps it in the root rollback).

import { isNodeRuntime } from "@/lib/utils/guards";
import { oscClient } from "@/stores/osc";
import type { NodeRuntime, RuntimeContext } from "@/types/runtime";
import { baseRuntime } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

export abstract class ScNode extends ScElement {
  /** The scsynth node id — 0 until the node goes live. */
  nodeId = 0;
  loaded = false;

  protected resolveRuntime(ctx: RuntimeContext): NodeRuntime {
    this.processChildren(ctx);
    return this.nodeRuntime(ctx);
  }

  /** The node-owning elements' runtime core. */
  protected nodeRuntime(ctx: RuntimeContext): NodeRuntime {
    return { ...baseRuntime(ctx), loaded: false, nodeId: 0 };
  }

  /** The scsynth group this node's create targets: the nearest LOADED node
   *  ancestor — the enclosing sc-group's node, or the plugin group (the walk
   *  skips transparent containers and not-yet-live nodes naturally). */
  protected get targetGroupId(): number {
    for (let el = this._parentScNode; el; el = el._parentScNode) {
      if (isNodeRuntime(el) && el.nodeId !== 0) return el.nodeId;
    }
    throw new Error(`<${this.tagName.toLowerCase()}>: no loaded ancestor group`);
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
