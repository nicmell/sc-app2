// <sc-option> — one declarative choice inside an sc-select. Stub: rendering
// inside the select arrives with the inputs migration step.

import { property } from "lit/decorators.js";
import type { RuntimeContext, ScOptionRuntime, ScOptionProps, UgenRuntime } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScOption extends ScElement<ScOptionRuntime> implements ScOptionProps {
  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";

  validate(): void {
    this.requireNumeric("value", this.value);
  }

  /** A declarative entry consumed by the parent select — never enabled. */
  protected resolveRuntime(ctx: RuntimeContext): UgenRuntime {
    return { ...this.baseRuntime(ctx), enabled: false };
  }
}
