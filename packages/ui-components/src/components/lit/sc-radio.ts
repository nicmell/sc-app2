// <sc-radio-base> — a UI-only radio button (ring + dot + optional label). Click
// emits `change` with its own `value`; `checked` is driven by the parent
// <sc-radio-group-base>. Lives as a light-DOM child of the group.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { ScWidgetBase } from "./internal/sc-widget-base";

export class ScRadioBase extends ScWidgetBase {
  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";
  @property({ type: Boolean }) accessor checked = false;

  private _onClick = (): void => {
    if (!this.disabled) this.emit(this.value);
  };

  render() {
    return html`
      <button
        type="button"
        class=${this.blockClasses("sc-radio", { "sc-radio--on": this.checked })}
        role="radio"
        aria-checked=${this.checked}
        aria-disabled=${this.disabled}
        ?disabled=${this.disabled}
        @click=${this._onClick}
      >
        <span class="sc-radio__ring"><span class="sc-radio__dot"></span></span>
        ${this.label ? html`<span class="sc-radio__label">${this.label}</span>` : ""}
      </button>
    `;
  }
}
