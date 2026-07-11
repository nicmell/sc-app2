// <sc-switch> — a toggle switch bound to a control/var (`bind:value`
// on the ScInput base). The switch sibling of sc-checkbox: the same 1/0 value
// seam, rendering the ui-components <sc-base-switch> (track + thumb) instead of
// the checkbox box. No `label` — sc-base-switch has none.

import { html } from "lit";
import { state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ifDefined } from "lit/directives/if-defined.js";
import type { ScSwitchBase } from "@sc-app/ui-components/lit";
import { ScInput } from "@/sc-elements/internal/sc-input";
import "@sc-app/ui-components/lit";

export class ScSwitch extends ScInput {
  @state() accessor _checked = false;

  protected syncFromState(value: number | string | undefined): void {
    const n = this.numericState(value);
    if (n !== undefined) this._checked = n !== 0;
  }

  private onChange = (e: Event) => {
    this.commit((e.target as ScSwitchBase).checked ? 1 : 0);
  };

  render() {
    return html`<sc-base-switch
      size=${ifDefined(this.getProp("size"))}
      ?disabled=${this.getProp("disabled")}
      .checked=${live(this._checked)}
      @change=${this.onChange}
    ></sc-base-switch>`;
  }
}
