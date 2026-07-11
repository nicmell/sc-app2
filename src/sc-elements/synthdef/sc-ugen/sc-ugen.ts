// <sc-ugen> — one UGen node inside an sc-synthdef (sc-control children are its
// inputs). The attributes live in the colocated spec (read via getProp); the
// graph collection consumes them at parse for the /d_recv-time compile.

import { ELEMENTS } from "@/constants/sc-elements";
import { isControlRuntime, typeOf } from "@/lib/utils/guards";
import type { BaseRuntime, RuntimeContext } from "@/types/runtime";
import {
  baseRuntime,
  failValidation,
  requireName,
  resolveNode,
} from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

/** UGens that take an <sc-env> envelope input. */
const ENVELOPE_UGENS: ReadonlySet<string> = new Set(["EnvGen"]);

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
    // <sc-env> belongs to an envelope ugen and only there; an envelope ugen
    // needs exactly one (its `envelope` input has no other source in markup).
    const type = this.getProp("type") as string;
    const envs = this._scChildren!.filter((c) => typeOf(c) === ELEMENTS.SC_ENV);
    if (envs.length > 0 && !ENVELOPE_UGENS.has(type)) {
      failValidation(this, `<sc-env> is only valid inside an EnvGen ugen (got "${type}")`);
    }
    if (ENVELOPE_UGENS.has(type) && envs.length !== 1) {
      failValidation(this, `EnvGen requires exactly one <sc-env> child (got ${envs.length})`);
    }
    // Every input reference (bind:value) must name a sibling ugen or a
    // synthdef param.
    for (const child of this._scChildren!) {
      const childBind = child.getAttribute("bind:value");
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
