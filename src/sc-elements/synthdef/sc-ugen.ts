// <sc-ugen> — one UGen node inside an sc-synthdef (sc-control children are its
// inputs). The attributes live here as reactive properties; the graph builder
// consumes them in the UGen migration step.

import { property } from "lit/decorators.js";
import { isControlRuntime } from "@/lib/utils/guards";
import type { BaseRuntime, RuntimeContext, ScUgenProps } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

const UGEN_RATES: ReadonlySet<string> = new Set(["ar", "kr", "ir"]);

export class ScUgen extends ScElement implements ScUgenProps {
  @property() accessor name = "";
  /** The SuperCollider UGen class — the element's `type` attribute. */
  @property({ attribute: "type" }) accessor ugen = "";
  @property() accessor rate = "ar";
  @property() accessor op: string | undefined = undefined;

  validate(): void {
    this.requireProp("name", this.name);
    this.requireProp("type", this.ugen);
    if (!UGEN_RATES.has(this.rate)) {
      this.failValidation(`"rate" attribute must be one of ar|kr|ir (got "${this.rate}")`);
    }
  }

  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    this.processChildren(ctx);
    // Every input bind must reference a sibling ugen or a synthdef param.
    for (const child of this.scChildren!) {
      if (!isControlRuntime(child) || !child.bind) continue;
      for (const ref of child.bind.split(",").map((s) => s.trim())) {
        const refId = ref.split(":")[0];
        if (!this.resolveNode(ctx, [refId])) {
          throw new Error(
            `<sc-ugen name="${this.name}">: input "${child.name}" references unknown "${refId}"`,
          );
        }
      }
    }
    return { ...this.baseRuntime(ctx), enabled: false };
  }
}
