// <sc-run> — a play/pause control for a node (`bind` targets a synth/group by
// name; empty targets the parent node). Stub: /n_run arrives with the inputs
// migration step. Presentational attributes (size/src/colors) are XSD-allowed
// but not declared yet.

import { property } from "lit/decorators.js";
import { isNodeRuntime } from "@/lib/utils/guards";
import type { RunRuntime, RuntimeContext, ScElementRuntimeBase, ScRunRuntime, ScRunProps } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScRun extends ScElement<ScRunRuntime> implements ScRunProps {
  @property() accessor bind = "";

  protected resolveRuntime(_item: ScElementRuntimeBase, ctx: RuntimeContext): RunRuntime {
    const target = this.bind ? this.resolveNode(ctx, this.bind.split(".")) : ctx.parentNode;
    if (this.bind && (!target || !isNodeRuntime(target))) {
      throw new Error(`<sc-run>: bind "${this.bind}" does not match any node in scope`);
    }
    return { ...this.baseRuntime(ctx), targetId: target ? target.id : "" };
  }
}
