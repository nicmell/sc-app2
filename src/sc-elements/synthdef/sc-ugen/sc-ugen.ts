// <sc-ugen> — one UGen node inside an sc-synthdef (sc-control children are its
// inputs). The attributes live in the colocated spec (read via getProp); the
// graph collection consumes them at parse for the /d_recv-time compile.

import { parseBind, splitTopLevel } from "@/lib/expression";
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
    // Every input reference (bind:value) must name a sibling ugen or a
    // synthdef param. A comma-token may be a plain ref, a `name.idx`
    // output/slot selector, or an arithmetic EXPRESSION — validate each
    // operand var it names (parseBind collects them into `paths`; a bare
    // number contributes none) with any numeric selector stripped off.
    const name = this.getProp("name") as string;
    for (const child of this._scChildren!) {
      const childBind = child.getAttribute("bind:value");
      if (!isControlRuntime(child) || !childBind) continue;
      const input = child.getProp("name") as string;
      // TOP-LEVEL commas only — commas inside `adsr(0.01, gate, …)` belong
      // to the call (whose NAME the parser never records as a path; its
      // args' references land in `paths` like any other operand).
      for (const token of splitTopLevel(childBind)) {
        for (const path of parseBind(token).paths) {
          const refId = path.replace(/\.\d+$/, ""); // drop a `.idx` selector
          if (!resolveNode(this, ctx, [refId])) {
            throw new Error(
              `<sc-ugen name="${name}">: input "${input}" references unknown "${refId}"`,
            );
          }
        }
      }
    }
    return { ...baseRuntime(ctx), enabled: false };
  }
}
