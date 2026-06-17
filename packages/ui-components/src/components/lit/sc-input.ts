// <sc-input-base> — a base text field. Light DOM, so it wraps a native <input>
// styled by the foundation's bare input{} rules (surface fill, border, focus
// ring) plus a `.sc-input` class for sizing/full-width. The native input/change
// flow straight to consumers (read e.target.value); the component just mirrors
// the value onto its `value` property. The numeric field is <sc-inputnumber-base>.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import cx from "classnames";

export type ScInputSize = "sm" | "md" | "lg";

export class ScInputBase extends LitElement {
  @property() accessor value = "";
  @property() accessor placeholder = "";
  @property() accessor type = "text";
  @property() accessor size: ScInputSize = "md";
  @property({ type: Boolean }) accessor disabled = false;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  // Mirror the native value; the native input/change keep bubbling.
  private _onInput = (e: Event): void => {
    this.value = (e.target as HTMLInputElement).value;
  };

  render() {
    return html`<input
      class=${cx("sc-input", `sc-input--${this.size}`)}
      type=${this.type}
      placeholder=${this.placeholder}
      ?disabled=${this.disabled}
      .value=${live(this.value)}
      @input=${this._onInput}
    />`;
  }
}
