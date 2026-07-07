// Base for the node-owning elements (sc-plugin / sc-group / sc-synth): the
// shared `run` attribute plus the node runtime values — `nodeId` (the scsynth
// node, assigned when it goes live) and `loaded`. The default runtime parses
// the children and resolves the node core; subclasses extend it (sc-synth
// checks its synthdef bind first, sc-plugin wraps it in the root rollback).

import { property } from "lit/decorators.js";
import { isControlRuntime, isNodeRuntime } from "@/lib/utils/guards";
import { oscClient } from "@/stores/osc";
import type { NodeRuntime, RuntimeContext } from "@/types/runtime";
import { baseRuntime } from "@/sc-elements/internal/validation";
import { runAttribute, ScElement } from "@/sc-elements/internal/sc-element";

export abstract class ScNode extends ScElement {
  @property(runAttribute) accessor run = true;

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

  /** This node's control params as /s_new name-value pairs — the enabled
   *  sc-control children's live `_state` (settled by the time a synth
   *  collects them: children load first — literal from the store sync,
   *  bound from the initial recompute), falling back to the declarative
   *  attribute mirror. */
  protected getControls(): Record<string, number> {
    const controls: Record<string, number> = {};
    for (const child of this._scChildren ?? []) {
      if (isControlRuntime(child) && child.enabled) {
        controls[child.name] = child._state ?? child.value ?? 0;
      }
    }
    return controls;
  }

  /** The scsynth group this node's create targets: the nearest LOADED node
   *  ancestor — the enclosing sc-group's node, or the plugin group (the walk
   *  skips transparent otcontainers and not-yet-live nodes naturally). */
  protected get targetGroupId(): number {
    for (let el = this._parentScNode; el; el = el._parentScNode) {
      if (isNodeRuntime(el) && el.nodeId !== 0) return el.nodeId;
    }
    throw new Error(`<${this.tagName.toLowerCase()}>: no loaded ancestor group`);
  }

  /** Pause (false) / resume (true) the live node (/n_run) — the seam sc-run
   *  and `run="false"` will drive at their step; a no-op until the node is
   *  live. The `run` ATTRIBUTE itself is parsed but not yet honored at load. */
  setRunning(running: boolean): void {
    if (!this.loaded || this.nodeId === 0) return;
    oscClient.setNodeRun(this.nodeId, running ? 1 : 0);
  }
}
