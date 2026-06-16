// <sc-option-base> — a UI-only option row (a single choice). Click emits
// `change` with its own `value`. `selected` is driven by the parent. Standalone
// (the logical sc-select wrapper later derives its `options` from these).

import { html } from "lit";
import { property } from "lit/decorators.js";
import { ScInputBase } from "./internal/sc-input-base";

export class ScOptionBase extends ScInputBase {
  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";
  @property({ type: Boolean }) accessor selected = false;

  private _onClick = (): void => {
    if (!this.disabled) this.emit(this.value);
  };

  render() {
    return html`
      <div
        class=${this.blockClasses("sc-option", { "sc-option--selected": this.selected })}
        role="option"
        aria-selected=${this.selected}
        aria-disabled=${this.disabled}
        @click=${this._onClick}
      >
        ${this.label}
      </div>
    `;
  }
}
