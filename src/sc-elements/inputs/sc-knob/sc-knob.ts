// <sc-knob> — a rotary knob bound to a control/var (`bind`/`_targetScNode` on
// the ScInput base). The rotary sibling of sc-slider: same value seam, same
// forwarding, but it renders the ui-components <sc-base-knob> (dial visual,
// dominant-axis drag) instead of the slider. No `orientation` — a knob has none.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import type { ScKnobBase } from "@sc-app/ui-components/lit";
import { ScInput } from "@/sc-elements/internal/sc-input";
import "@sc-app/ui-components/lit";

export class ScKnob extends ScInput {
  /** Genuinely reactive (attribute-seeded, reassigned by syncFromState, bound
   *  through `live()`); the rest are declarative — read via `getProp`. */
  @property({ type: Number }) accessor value = 0;

  protected syncFromState(value: number | undefined): void {
    if (value !== undefined) this.value = value;
  }

  private onInput = (e: Event) => {
    this.commit((e.target as ScKnobBase).value);
  };

  render() {
    return html`<sc-base-knob
      min=${this.getProp("min")}
      max=${this.getProp("max")}
      step=${this.getProp("step")}
      label=${this.getProp("label")}
      size=${this.getProp("size")}
      ?disabled=${this.getProp("disabled")}
      .value=${live(this.value)}
      @input=${this.onInput}
    ></sc-base-knob>`;
  }
}
