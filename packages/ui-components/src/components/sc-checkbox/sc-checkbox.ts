// <sc-checkbox-base> — a hidden native <input type="checkbox"> under a visual
// overlay (box + check). Shadow DOM: the <label> makes the whole widget the hit
// target; the input owns value and the native `change` is re-emitted (composed)
// from the host so consumers read `e.target.checked`. The overlay reflects state
// purely via CSS (`:checked`/`:focus-visible`).

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScControlBase } from "../internal/sc-control/sc-control";
import resetStyles from "../../foundations/reset.scss";
import controlStyles from "../../foundations/base/controls.scss";
import styles from "./sc-checkbox.scss";

export class ScCheckboxBase extends ScControlBase {
  static styles = [resetStyles, controlStyles, styles];

  @property({ type: Boolean }) accessor checked = false;
  @property() accessor label = "";

  // Sync the property, then re-emit a composed `change` from the host.
  private _onChange = (e: Event): void => {
    e.stopPropagation();
    this.checked = (e.target as HTMLInputElement).checked;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  render() {
    return html`
      <label>
        <input
          class="input sr-only"
          type="checkbox"
          name=${this.name}
          .checked=${live(this.checked)}
          ?disabled=${this.disabled}
          @change=${this._onChange}
        />
        <span class="box"><span class="check"></span></span>
        ${this.label ? html`<span>${this.label}</span>` : ""}
      </label>
    `;
  }
}
