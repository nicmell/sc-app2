// Base for the node-owning elements (sc-plugin / sc-group / sc-synth): the
// shared `run` attribute plus the node runtime values — `nodeId` (the scsynth
// node, assigned when it goes live) and `loaded`. The default runtime parses
// the children and resolves the node core; subclasses extend it (sc-synth
// checks its synthdef bind first, sc-plugin wraps it in the root rollback).

import { property } from "lit/decorators.js";
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
}
