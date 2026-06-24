// <sc-switch-base> — a hidden native <input type="checkbox" role="switch"> under
// a track+thumb overlay. Shadow DOM: the <label> is the hit target; the input
// owns value and the native `change` is re-emitted (composed) from the host
// (read `e.target.checked`); the overlay animates via CSS.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScWidgetBase } from "../internal/sc-widget-base";
import { foundations } from "../internal/foundation-styles";
import widgetStyles from "../internal/widget-base.scss";
import styles from "./sc-switch.scss";

export class ScSwitchBase extends ScWidgetBase {
  static styles = [foundations, widgetStyles, styles];

  @property({ type: Boolean }) accessor checked = false;

  private _onChange = (e: Event): void => {
    e.stopPropagation();
    this.checked = (e.target as HTMLInputElement).checked;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  render() {
    return html`
      <label class=${this.widgetClasses()}>
        <input
          class="input sr-only"
          type="checkbox"
          role="switch"
          name=${this.name}
          .checked=${live(this.checked)}
          ?disabled=${this.disabled}
          @change=${this._onChange}
        />
        <span class="track"><span class="thumb"></span></span>
      </label>
    `;
  }
}
