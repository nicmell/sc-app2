// <sc-input-base> — a base text field. Light DOM, so it wraps a native <input>
// styled by the foundation's bare input{} rules (surface fill, border, focus
// ring) plus a `.sc-input` class for sizing/full-width. Holds `value` as a
// property and dispatches a single `change` CustomEvent ({ value: string }) on
// every edit (the native input/change events are swallowed so consumers see
// only the component's event). The numeric field is <sc-inputnumber-base>.

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

  /** Emit one `change` per edit; swallow the native event of the same name. */
  private _onInput = (e: Event): void => {
    e.stopPropagation();
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value }, bubbles: true, composed: true }),
    );
  };

  private _swallow = (e: Event): void => {
    e.stopPropagation();
  };

  render() {
    return html`<input
      class=${cx("sc-input", `sc-input--${this.size}`)}
      type=${this.type}
      placeholder=${this.placeholder}
      ?disabled=${this.disabled}
      .value=${live(this.value)}
      @input=${this._onInput}
      @change=${this._swallow}
    />`;
  }
}
