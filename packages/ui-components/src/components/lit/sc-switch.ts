// <sc-switch-base> — a UI-only toggle switch: a pill track with a sliding
// thumb (CSS-animated). Click toggles; emits `change` with value 0|1.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { ScWidgetBase } from "./internal/sc-widget-base";

export class ScSwitchBase extends ScWidgetBase {
  @property({ type: Boolean }) accessor checked = false;

  private _toggle = (): void => {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.emit(this.checked ? 1 : 0);
  };

  render() {
    return html`
      <button
        type="button"
        class=${this.blockClasses("sc-switch", { "sc-switch--on": this.checked })}
        role="switch"
        aria-checked=${this.checked}
        aria-disabled=${this.disabled}
        ?disabled=${this.disabled}
        @click=${this._toggle}
      >
        <span class="sc-switch__track"><span class="sc-switch__thumb"></span></span>
      </button>
    `;
  }
}
