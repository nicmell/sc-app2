// <sc-switch-base> — a hidden native <input type="checkbox" role="switch"> under
// a track+thumb overlay. The <label> is the hit target; the input owns value +
// fires the native `change` (read `e.target.checked`); the overlay animates via
// CSS (`:checked`/`:focus-visible`).

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScWidgetBase } from "../internal/sc-widget-base";
import styles from "./sc-switch.module.css";

export class ScSwitchBase extends ScWidgetBase {
  @property({ type: Boolean }) accessor checked = false;

  private _onChange = (e: Event): void => {
    this.checked = (e.target as HTMLInputElement).checked;
  };

  render() {
    return html`
      <label class=${this.widgetClasses(styles)}>
        <input
          class="${styles.input} sr-only"
          type="checkbox"
          role="switch"
          name=${this.name}
          .checked=${live(this.checked)}
          ?disabled=${this.disabled}
          @change=${this._onChange}
        />
        <span class=${styles.track}><span class=${styles.thumb}></span></span>
      </label>
    `;
  }
}
