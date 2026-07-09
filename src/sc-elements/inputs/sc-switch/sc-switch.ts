// <sc-switch> — a toggle switch bound to a control/var (`bind`/`_targetScNode`
// on the ScInput base). The switch sibling of sc-checkbox: the same 1/0 value
// seam, rendering the ui-components <sc-base-switch> (track + thumb) instead of
// the checkbox box. No `label` — sc-base-switch has none.

import { html } from "lit";
import { state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import type { ScSwitchBase } from "@sc-app/ui-components/lit";
import { ScInput } from "@/sc-elements/internal/sc-input";
import "@sc-app/ui-components/lit";

export class ScSwitch extends ScInput {
  @state() accessor _checked = false;

  protected syncFromState(value: number | undefined): void {
    if (value !== undefined) this._checked = value !== 0;
  }

  private onChange = (e: Event) => {
    this.commit((e.target as ScSwitchBase).checked ? 1 : 0);
  };

  render() {
    return html`<sc-base-switch
      size=${this.getProp("size")}
      ?disabled=${this.getProp("disabled")}
      .checked=${live(this._checked)}
      @change=${this.onChange}
    ></sc-base-switch>`;
  }
}
