// <sc-checkbox> — a checkbox bound to a control/var (`bind`/`_targetScNode` on
// the ScInput base). Renders the ui-components <sc-base-checkbox>, forwarding
// its props. Checked maps to the value 1, unchecked to 0; the shared ScInput
// seam wires the load-pass subscription (syncFromState) and the write path
// (commit), reading the target through `_state`/`onStateChange`.

import { html } from "lit";
import { state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import type { ScCheckboxBase } from "@sc-app/ui-components/lit";
import { ScInput } from "@/sc-elements/internal/sc-input";
import "@sc-app/ui-components/lit";

export class ScCheckbox extends ScInput {
  @state() accessor _checked = false;

  protected syncFromState(value: number | string | undefined): void {
    const n = this.numericState(value);
    if (n !== undefined) this._checked = n !== 0;
  }

  private onChange = (e: Event) => {
    this.commit((e.target as ScCheckboxBase).checked ? 1 : 0);
  };

  render() {
    return html`<sc-base-checkbox
      label=${this.getProp("label")}
      size=${this.getProp("size")}
      ?disabled=${this.getProp("disabled")}
      .checked=${live(this._checked)}
      @change=${this.onChange}
    ></sc-base-checkbox>`;
  }
}
