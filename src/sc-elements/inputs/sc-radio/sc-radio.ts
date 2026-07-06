// <sc-radio> — one declarative choice inside an sc-radio-group: pure data
// (`value`/`label`), collected by the parent at parse and projected into an
// <sc-base-radio>. Consumed by the parent, never enabled. Presentational
// attributes (width/height/src/colors) are XSD-allowed but not declared yet.

import { property } from "lit/decorators.js";
import type { BaseRuntime, RuntimeContext } from "@/types/runtime";
import { baseRuntime, requireNumeric } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScRadio extends ScElement {
  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";

  validate(): void {
    requireNumeric(this, "value", this.value);
  }

  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    return { ...baseRuntime(ctx), enabled: false };
  }
}
