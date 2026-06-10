// <sc-radio-group> — a radio set over its sc-radio children, bound to a
// control/var (`bind`/`targetId` on the ScInput base). Stub: the radio UI +
// value dispatch arrive with the inputs migration step.

import { property } from "lit/decorators.js";
import type { InputRuntime, RuntimeContext } from "@/types/runtime";
import { failValidation, requireProp } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";

export class ScRadioGroup extends ScInput {
  @property() accessor orientation: "horizontal" | "vertical" = "horizontal";

  validate(): void {
    requireProp(this, "bind", this.bind);
    if (this.orientation !== "horizontal" && this.orientation !== "vertical") {
      failValidation(this, `"orientation" attribute must be horizontal|vertical (got "${this.orientation}")`);
    }
  }

  protected resolveRuntime(ctx: RuntimeContext): InputRuntime {
    this.processChildren(ctx);
    return super.resolveRuntime(ctx);
  }
}
