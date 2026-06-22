// <sc-switch-base> — a hidden native <input type="checkbox" role="switch"> under
// a track+thumb overlay. Shadow DOM: the <label> is the hit target; the input
// owns value and the native `change` is re-emitted (composed) from the host
// (read `e.target.checked`); the overlay animates via CSS.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScWidgetBase } from "../internal/sc-widget-base";
import { foundations } from "../internal/foundation-styles";
import { widgetStyles } from "../internal/widget-base.styles";
import { relay } from "../internal/events";
import { styles } from "./sc-switch.styles";

export class ScSwitchBase extends ScWidgetBase {
  static styles = [foundations, widgetStyles, styles];

  @property({ type: Boolean }) accessor checked = false;

  private _relay = (e: Event): void => {
    this.checked = (e.target as HTMLInputElement).checked;
    relay(this, e, e.type as "input" | "change");
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
          @input=${this._relay}
          @change=${this._relay}
        />
        <span class="track"><span class="thumb"></span></span>
      </label>
    `;
  }
}
