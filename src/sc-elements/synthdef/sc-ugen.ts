// <sc-ugen> — one UGen node inside an sc-synthdef (sc-control children are its
// inputs). The attributes live here as reactive properties; the graph builder
// consumes them in the UGen migration step.

import { property } from "lit/decorators.js";
import { isControlRuntime } from "@/lib/utils/guards";
import type { BaseRuntime, RuntimeContext } from "@/types/runtime";
import { baseRuntime, failValidation, requireProp, resolveNode } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

const UGEN_RATES: ReadonlySet<string> = new Set(["ar", "kr", "ir"]);

export class ScUgen extends ScElement {
  @property() accessor name = "";
  /** The SuperCollider UGen class — the element's `type` attribute. */
  @property({ attribute: "type" }) accessor ugen = "";
  @property() accessor rate = "ar";
  @property() accessor op: string | undefined = undefined;

  validate(): void {
    requireProp(this, "name", this.name);
    requireProp(this, "type", this.ugen);
    if (!UGEN_RATES.has(this.rate)) {
      failValidation(this, `"rate" attribute must be one of ar|kr|ir (got "${this.rate}")`);
    }
  }

  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    this.processChildren(ctx);
    // Every input bind must reference a sibling ugen or a synthdef param.
    for (const child of this._scChildren!) {
      if (!isControlRuntime(child) || !child.bind) continue;
      for (const ref of child.bind.split(",").map((s) => s.trim())) {
        const refId = ref.split(":")[0];
        if (!resolveNode(this, ctx, [refId])) {
          throw new Error(
            `<sc-ugen name="${this.name}">: input "${child.name}" references unknown "${refId}"`,
          );
        }
      }
    }
    return { ...baseRuntime(ctx), enabled: false };
  }
}
