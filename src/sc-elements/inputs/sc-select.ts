// <sc-select> — a dropdown over its sc-option children, bound to a
// control/var (`bind`/`targetId` on the ScInput base). Stub: the combobox UI
// + value dispatch arrive with the inputs migration step.

import type { InputRuntime, RuntimeContext, ScSelectProps } from "@/types/runtime";
import { ScInput } from "@/sc-elements/internal/sc-input";

export class ScSelect extends ScInput implements ScSelectProps {
  validate(): void {
    this.requireProp("bind", this.bind);
  }

  protected resolveRuntime(ctx: RuntimeContext): InputRuntime {
    this.processChildren(ctx);
    return super.resolveRuntime(ctx);
  }
}
