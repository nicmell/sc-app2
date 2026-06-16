// <sc-switch-base> — a hidden native <input type="checkbox" role="switch"> under
// a track+thumb overlay. The <label> is the hit target; the input owns value +
// fires the native `change` (read `e.target.checked`); the overlay animates via
// CSS (`:checked`/`:focus-visible`).

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScWidgetBase } from "./internal/sc-widget-base";

export class ScSwitchBase extends ScWidgetBase {
  @property({ type: Boolean }) accessor checked = false;

  private _onChange = (e: Event): void => {
    this.checked = (e.target as HTMLInputElement).checked;
  };

  render() {
    return html`
      <label class=${this.blockClasses("sc-switch")}>
        <input
          class="sc-switch__input sr-only"
          type="checkbox"
          role="switch"
          .checked=${live(this.checked)}
          ?disabled=${this.disabled}
          @change=${this._onChange}
        />
        <span class="sc-switch__track"><span class="sc-switch__thumb"></span></span>
      </label>
    `;
  }
}
