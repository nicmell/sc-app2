// <sc-checkbox-base> — a UI-only checkbox: a styled box with an optional
// trailing label. Click/Space toggles; emits `change` with value 0|1.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { ScWidgetBase } from "./internal/sc-widget-base";

export class ScCheckboxBase extends ScWidgetBase {
  @property({ type: Boolean }) accessor checked = false;
  @property() accessor label = "";

  private _toggle = (): void => {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.emit(this.checked ? 1 : 0);
  };

  render() {
    return html`
      <button
        type="button"
        class=${this.blockClasses("sc-checkbox", { "sc-checkbox--on": this.checked })}
        role="checkbox"
        aria-checked=${this.checked}
        aria-disabled=${this.disabled}
        ?disabled=${this.disabled}
        @click=${this._toggle}
      >
        <span class="sc-checkbox__box"><span class="sc-checkbox__check"></span></span>
        ${this.label ? html`<span class="sc-checkbox__label">${this.label}</span>` : ""}
      </button>
    `;
  }
}
