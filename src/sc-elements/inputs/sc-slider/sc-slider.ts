// <sc-slider> — a slider bound to a control/var (`bind`/`_targetScNode` on the
// ScInput base). Renders the ui-components <sc-base-slider>, forwarding every
// slider prop; the value plumbing (drag/wheel/keyboard, quantise, composed
// input/change) lives in the base widget. The shared ScInput seam wires the
// load-pass subscription (syncFromState) and the write path (commit): reads
// come through the uniform `_state` + `onStateChange()` seam (literal or
// derived alike), writes go through the target's `setValue()`.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import type { ScSize, ScSliderBase } from "@sc-app/ui-components/lit";
import { requireNumeric } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";
import "@sc-app/ui-components/lit";

export class ScSlider extends ScInput {
  @property({ type: Number }) accessor min = 0;
  @property({ type: Number }) accessor max = 1;
  @property({ type: Number }) accessor step = 0.01;
  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";
  @property() accessor size: ScSize = "md";
  @property({ type: Boolean }) accessor disabled = false;
  @property() accessor orientation: "horizontal" | "vertical" = "horizontal";

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
    this.commit((e.target as ScSliderBase).value);
  };

  render() {
    return html`<sc-base-slider
      min=${this.min}
      max=${this.max}
      step=${this.step}
      label=${this.label}
      size=${this.size}
      orientation=${this.orientation}
      ?disabled=${this.disabled}
      .value=${live(this.value)}
      @input=${this.onInput}
    ></sc-base-slider>`;
  }
}
