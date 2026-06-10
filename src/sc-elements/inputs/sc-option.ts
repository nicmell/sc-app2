// <sc-option> — one declarative choice inside an sc-select: consumed by the
// parent, never enabled. Stub: rendering inside the select arrives with the
// inputs migration step.

import { property } from "lit/decorators.js";
import type { BaseRuntime, RuntimeContext, ScOptionProps } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScOption extends ScElement implements ScOptionProps {
  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";

  validate(): void {
    this.requireNumeric("value", this.value);
  }

  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    return { ...this.baseRuntime(ctx), enabled: false };
  }
}
