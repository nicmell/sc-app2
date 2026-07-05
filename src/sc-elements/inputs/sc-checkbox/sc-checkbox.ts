// <sc-checkbox> — a toggle bound to a control/var (`bind`/`_targetScNode` on
// the ScInput base). Still a bare native <input type="checkbox"> for now (the
// sc-base-checkbox swap lands with the rest of the inputs). Checked maps to
// the value 1, unchecked to 0; the shared ScInput seam wires the load-pass
// subscription (syncFromState) and the write path (commit).

import { html } from "lit";
import { state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { requireProp } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";

export class ScCheckbox extends ScInput {
  @state() accessor _checked = false;

  validate(): void {
    requireProp(this, "bind", this.bind);
  }

  protected syncFromState(value: number | undefined): void {
    if (value !== undefined) this._checked = value !== 0;
  }

  private onChange = (e: Event) => {
    this.commit((e.target as HTMLInputElement).checked ? 1 : 0);
  };

  render() {
    // live(): the user mutates the native input directly, so the binding
    // must compare against the DOM value, not the last committed render.
    return html`<input type="checkbox" .checked=${live(this._checked)} @change=${this.onChange} />`;
  }
}
