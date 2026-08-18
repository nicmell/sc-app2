// <sc-slider> — a slider bound to a control/var (`bind:value` on the ScInput
// base — a plain path is writable, an expression makes it a read-only meter). Renders the ui-components <sc-base-slider>, forwarding every
// slider prop; the value plumbing (drag/wheel/keyboard, quantise, composed
// input/change) lives in the base widget. The shared ScInput seam wires the
// load-pass subscription (syncFromState) and the write path (commit): reads
// come through the uniform `_state` + `onStateChange()` seam (literal or
// derived alike), writes go through the target's `setValue()`.

import { html } from "lit";
import { state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ifDefined } from "lit/directives/if-defined.js";
import type { ScSliderBase } from "@sc-app/ui-components/lit";
import { ScInput } from "@/sc-elements/internal/sc-input";
import "@sc-app/ui-components/lit";

export class ScSlider extends ScInput {
  /** Genuinely reactive widget-facing value: seeded by the load pass (bound
   *  recompute or the static `value` attribute) and bound through `live()`.
   *  Internal — the attributes are read via `getProp` like everywhere else. */
  @state() accessor _value = 0;

  protected syncFromState(value: number | string | undefined): void {
    const n = this.numericState(value);
    if (n !== undefined) this._value = n;
  }

  private onInput = (e: Event) => {
    this.commit((e.target as ScSliderBase).value);
  };

  render() {
    return html`<sc-base-slider
      min=${ifDefined(this.getProp("min"))}
      max=${ifDefined(this.getProp("max"))}
      step=${ifDefined(this.getProp("step"))}
      label=${ifDefined(this.getProp("label"))}
      size=${ifDefined(this.getProp("size"))}
      orientation=${ifDefined(this.getProp("orientation"))}
      ?disabled=${this.getProp("disabled")}
      .value=${live(this._value)}
      @input=${this.onInput}
    ></sc-base-slider>`;
  }
}
