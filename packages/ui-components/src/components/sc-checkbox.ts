// <sc-checkbox-base> — a hidden native <input type="checkbox"> under a visual
// overlay (box + check). The <label> makes the whole widget the hit target;
// the input owns value + fires the native `change` (read `e.target.checked`).
// The overlay reflects state purely via CSS (`:checked`/`:focus-visible`).

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScWidgetBase } from "./internal/sc-widget-base";

export class ScCheckboxBase extends ScWidgetBase {
  @property({ type: Boolean }) accessor checked = false;
  @property() accessor label = "";

  // Sync the property; the native `change` keeps bubbling to consumers.
  private _onChange = (e: Event): void => {
    this.checked = (e.target as HTMLInputElement).checked;
  };

  render() {
    return html`
      <label class=${this.blockClasses("sc-checkbox")}>
        <input
          class="sc-checkbox__input sr-only"
          type="checkbox"
          name=${this.name}
          .checked=${live(this.checked)}
          ?disabled=${this.disabled}
          @change=${this._onChange}
        />
        <span class="sc-checkbox__box"><span class="sc-checkbox__check"></span></span>
        ${this.label ? html`<span class="sc-checkbox__label">${this.label}</span>` : ""}
      </label>
    `;
  }
}
