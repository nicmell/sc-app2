// <sc-run> — a play/pause control for a node (`bind` targets a synth/group by
// name; empty targets the parent node — unlike the other ScInput elements its
// `_targetScNode` points at a node). Stub: /n_run arrives with the inputs
// migration step. Presentational attributes (size/src/colors) are XSD-allowed
// but not declared yet.

import { isNodeRuntime } from "@/lib/utils/guards";
import type { InputRuntime, RuntimeContext, ScRunProps } from "@/types/runtime";
import { baseRuntime, resolveNode } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";

export class ScRun extends ScInput implements ScRunProps {
  protected resolveRuntime(ctx: RuntimeContext): InputRuntime {
    const target = this.bind ? resolveNode(this, ctx, this.bind.split(".")) : ctx.parentNode;
    if (this.bind && (!target || !isNodeRuntime(target))) {
      throw new Error(`<sc-run>: bind "${this.bind}" does not match any node in scope`);
    }
    return { ...baseRuntime(ctx), _targetScNode: target };
  }
}
