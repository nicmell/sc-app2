// <sc-knob> — a rotary knob bound to a control/var (`bind:value` on the
// ScInput base — a plain path is writable, an expression is a read-only meter). The rotary sibling of sc-slider: same value seam, same
// forwarding, but it renders the ui-components <sc-base-knob> (dial visual,
// dominant-axis drag) instead of the slider. No `orientation` — a knob has none.

import { html } from "lit";
import { state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ifDefined } from "lit/directives/if-defined.js";
import type { ScKnobBase } from "@sc-app/ui-components/lit";
import { ScInput } from "@/sc-elements/internal/sc-input";
import "@sc-app/ui-components/lit";

export class ScKnob extends ScInput {
  /** Genuinely reactive widget-facing value: seeded by the load pass (bound
   *  recompute or the static `value` attribute) and bound through `live()`.
   *  Internal — the attributes are read via `getProp` like everywhere else. */
  @state() accessor _value = 0;

  protected syncFromState(value: number | string | undefined): void {
    const n = this.numericState(value);
    if (n !== undefined) this._value = n;
  }

  private onInput = (e: Event) => {
    this.commit((e.target as ScKnobBase).value);
  };

  render() {
    return html`<sc-base-knob
      min=${ifDefined(this.getProp("min"))}
      max=${ifDefined(this.getProp("max"))}
      step=${ifDefined(this.getProp("step"))}
      label=${ifDefined(this.getProp("label"))}
      size=${ifDefined(this.getProp("size"))}
      ?disabled=${this.getProp("disabled")}
      .value=${live(this._value)}
      @input=${this.onInput}
    ></sc-base-knob>`;
  }
}
