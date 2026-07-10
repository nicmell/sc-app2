// <sc-run> — a play/pause control for a node (`bind` targets a synth/group by
// name; empty targets the parent node — unlike the other ScInput elements its
// `_targetScNode` points at a node). Stub: /n_run arrives with the inputs
// migration step. Presentational attributes (size/src/colors) are XSD-allowed
// but not declared yet.

import { isNodeRuntime } from "@/lib/utils/guards";
import type { InputRuntime, RuntimeContext } from "@/types/runtime";
import { baseRuntime, resolveNode } from "@/sc-elements/internal/validation";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import { ScInput } from "@/sc-elements/internal/sc-input";

export class ScRun extends ScInput {
  /** The live bound target — a NODE (unlike the value inputs, which derive
   *  their state target from `bind:value`; sc-run is the lone `bind` input). */
  _targetScNode?: ScElement;

  protected resolveRuntime(ctx: RuntimeContext): InputRuntime {
    const bind = this.getProp("bind") as string | undefined;
    const target = bind ? resolveNode(this, ctx, bind.split(".")) : ctx.parentNode;
    if (bind && (!target || !isNodeRuntime(target))) {
      throw new Error(`<sc-run>: bind "${bind}" does not match any node in scope`);
    }
    return { ...baseRuntime(ctx), _targetScNode: target };
  }
}
