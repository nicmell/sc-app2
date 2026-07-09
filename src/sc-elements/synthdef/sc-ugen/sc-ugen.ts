// <sc-ugen> — one UGen node inside an sc-synthdef (sc-control children are its
// inputs). The attributes live in the colocated spec (read via getProp); the
// graph collection consumes them at parse for the /d_recv-time compile.

import { isControlRuntime } from "@/lib/utils/guards";
import type { BaseRuntime, RuntimeContext } from "@/types/runtime";
import {
  baseRuntime,
  failValidation,
  requireName,
  resolveNode,
} from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

const UGEN_RATES: ReadonlySet<string> = new Set(["ar", "kr", "ir"]);

export class ScUgen extends ScElement {
  validate(): void {
    requireName(this);
    // `type` is required (via validateProps); `rate` defaults to "ar" and is
    // the one enum the spec leaves to a semantic check (it's a plain string).
    const rate = (this.getProp("rate") as string) ?? "ar";
    if (!UGEN_RATES.has(rate)) {
      failValidation(this, `"rate" attribute must be one of ar|kr|ir (got "${rate}")`);
    }
  }

  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    this.processChildren(ctx);
    // Every input bind must reference a sibling ugen or a synthdef param.
    for (const child of this._scChildren!) {
      const childBind = child.getProp("bind") as string | undefined;
      if (!isControlRuntime(child) || !childBind) continue;
      for (const ref of childBind.split(",").map((s) => s.trim())) {
        const refId = ref.split(":")[0];
        if (!resolveNode(this, ctx, [refId])) {
          throw new Error(
            `<sc-ugen name="${this.getProp("name")}">: input "${child.getProp("name")}" references unknown "${refId}"`,
          );
        }
      }
    }
    return { ...baseRuntime(ctx), enabled: false };
  }
}
