// <sc-knob> — a rotary knob bound to a control/var (`bind`/`_targetScNode` on
// the ScInput base). The rotary sibling of sc-range: same value seam, same
// forwarding, but it renders the ui-components <sc-base-knob> (dial visual,
// dominant-axis drag) instead of the slider. No `orientation` — a knob has none.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import type { ScKnobBase, ScSize } from "@sc-app/ui-components/lit";
import { requireNumeric } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";
import "@sc-app/ui-components/lit";

export class ScKnob extends ScInput {
  @property({ type: Number }) accessor min = 0;
  @property({ type: Number }) accessor max = 1;
  @property({ type: Number }) accessor step = 0.01;
  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";
  @property() accessor size: ScSize = "md";
  @property({ type: Boolean }) accessor disabled = false;

  validate(): void {
    requireNumeric(this, "min", this.min);
    requireNumeric(this, "max", this.max);
    requireNumeric(this, "step", this.step);
    requireNumeric(this, "value", this.value);
  }

  protected syncFromState(value: number | undefined): void {
    if (value !== undefined) this.value = value;
  }

  private onInput = (e: Event) => {
    this.commit((e.target as ScKnobBase).value);
  };

  render() {
    return html`<sc-base-knob
      min=${this.min}
      max=${this.max}
      step=${this.step}
      label=${this.label}
      size=${this.size}
      ?disabled=${this.disabled}
      .value=${live(this.value)}
      @input=${this.onInput}
    ></sc-base-knob>`;
  }
}
