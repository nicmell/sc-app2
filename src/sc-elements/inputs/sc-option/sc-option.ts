// <sc-option> — one declarative choice inside an sc-select: consumed by the
// parent, never enabled. Stub: rendering inside the select arrives with the
// inputs migration step.

import { property } from "lit/decorators.js";
import type { BaseRuntime, RuntimeContext } from "@/types/runtime";
import { baseRuntime, requireNumeric } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScOption extends ScElement {
  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";

  validate(): void {
    requireNumeric(this, "value", this.value);
  }

  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    return { ...baseRuntime(ctx), enabled: false };
  }
}
