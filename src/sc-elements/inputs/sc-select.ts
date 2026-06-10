// <sc-select> — a dropdown over its sc-option children, bound to a
// control/var. Stub: the combobox UI + value dispatch arrive with the inputs
// migration step.

import { property } from "lit/decorators.js";
import type { InputRuntime, RuntimeContext, ScElementRuntimeBase, ScSelectRuntime, ScSelectProps } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScSelect extends ScElement<ScSelectRuntime> implements ScSelectProps {
  @property() accessor bind = "";

  validate(): void {
    this.requireProp("bind", this.bind);
  }

  protected resolveRuntime(item: ScElementRuntimeBase, ctx: RuntimeContext): InputRuntime {
    this.processChildren(item, ctx);
    return this.resolveVisualBind(ctx, this.bind);
  }
}
