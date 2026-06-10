// <sc-range> — a range input bound to a control (`bind`/`targetId` on the
// ScInput base). Deliberately unstyled for now: a native <input type="range">;
// the knob/slider internals return with the inputs migration step. Changing
// it is a stub — the bound control doesn't move yet.

import { html } from "lit";
import { property } from "lit/decorators.js";
import type { ScRangeProps } from "@/types/runtime";
import { requireNumeric } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";

export class ScRange extends ScInput implements ScRangeProps {
  @property({ type: Number }) accessor min = 0;
  @property({ type: Number }) accessor max = 1;
  @property({ type: Number }) accessor step = 0.01;
  @property({ type: Number }) accessor value = 0;

  validate(): void {
    requireNumeric(this, "min", this.min);
    requireNumeric(this, "max", this.max);
    requireNumeric(this, "step", this.step);
    requireNumeric(this, "value", this.value);
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
