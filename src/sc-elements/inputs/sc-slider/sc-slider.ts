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
import type { ScSliderBase } from "@sc-app/ui-components/lit";
import { ScInput } from "@/sc-elements/internal/sc-input";
import "@sc-app/ui-components/lit";

export class ScSlider extends ScInput {
  /** Genuinely reactive: attribute-seeded, then reassigned by syncFromState
   *  and bound through `live()`. The rest (min/max/step/label/size/…) are
   *  declarative — read via `getProp`, forwarded (absent → base default). */
  @property({ type: Number }) accessor value = 0;

  protected syncFromState(value: number | undefined): void {
    if (value !== undefined) this.value = value;
  }

  private onInput = (e: Event) => {
    this.commit((e.target as ScSliderBase).value);
  };

  render() {
    return html`<sc-base-slider
      min=${this.getProp("min")}
      max=${this.getProp("max")}
      step=${this.getProp("step")}
      label=${this.getProp("label")}
      size=${this.getProp("size")}
      orientation=${this.getProp("orientation")}
      ?disabled=${this.getProp("disabled")}
      .value=${live(this.value)}
      @input=${this.onInput}
    ></sc-base-slider>`;
  }
}
