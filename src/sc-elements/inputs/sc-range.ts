// <sc-range> — a range input bound to a control (`bind`). Deliberately
// unstyled for now: a native <input type="range">; the knob/slider internals
// return with the inputs migration step. Changing it is a stub — the bound
// control doesn't move yet.

import { html } from "lit";
import { property } from "lit/decorators.js";
import type { InputRuntime, RuntimeContext, ScRangeRuntime, ScRangeProps } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScRange extends ScElement<ScRangeRuntime> implements ScRangeProps {
  @property() accessor bind = "";
  @property({ type: Number }) accessor min = 0;
  @property({ type: Number }) accessor max = 1;
  @property({ type: Number }) accessor step = 0.01;
  @property({ type: Number }) accessor value = 0;

  validate(): void {
    this.requireNumeric("min", this.min);
    this.requireNumeric("max", this.max);
    this.requireNumeric("step", this.step);
    this.requireNumeric("value", this.value);
  }

  protected resolveRuntime(ctx: RuntimeContext): InputRuntime {
    return this.resolveVisualBind(ctx, this.bind);
  }

  private onInput = (e: Event) => {
    const value = Number((e.target as HTMLInputElement).value);
    this.value = value;
    // Stub: control propagation arrives with the controls migration step.
    console.debug(`[sc-range] ${this.bind || "(unbound)"} → ${value}`);
  };

  render() {
    return html`<input
      type="range"
      min=${this.min}
      max=${this.max}
      step=${this.step}
      .value=${String(this.value)}
      @input=${this.onInput}
    />`;
  }
}
