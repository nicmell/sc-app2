// <sc-var> — a state variable: a literal `value` or a `bind` reference /
// arithmetic expression over references (mutually exclusive). No OSC — pure
// frontend state. Stub: reactive value propagation arrives with the state
// migration step.

import { property } from "lit/decorators.js";
import type { RuntimeContext, ScVarRuntime, ScVarProps, VarRuntime } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScVar extends ScElement<ScVarRuntime> implements ScVarProps {
  @property() accessor name = "";
  @property() accessor bind: string | undefined = undefined;
  @property({ type: Number }) accessor value: number | undefined = undefined;

  validate(): void {
    this.requireProp("name", this.name);
    if (this.bind !== undefined && this.value !== undefined) {
      this.failValidation(`"value" and "bind" are mutually exclusive`);
    }
    this.requireNumeric("value", this.value);
  }

  /** Always enabled (unlike sc-control, never a graph input). */
  protected resolveRuntime(ctx: RuntimeContext): VarRuntime {
    if (this.bind) {
      const { targets, expression } = this.resolveStateBind(ctx, this.bind);
      return { ...this.baseRuntime(ctx), name: this.name, value: 0, targets, expression };
    }
    return { ...this.baseRuntime(ctx), name: this.name, value: this.value ?? 0 };
  }
}
