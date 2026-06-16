// <sc-textarea-base> — a multi-line text field. Light DOM, wrapping a native
// <textarea> styled by the foundation (sans font, vertical resize, surface
// fill, focus ring) plus a `.sc-textarea` class for sizing/full-width. Holds
// `value` as a property and dispatches a single `change` CustomEvent
// ({ value: string }) per edit (native input/change are swallowed).

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import cx from "classnames";
import type { ScInputSize } from "./sc-input";

export class ScTextareaBase extends LitElement {
  @property() accessor value = "";
  @property() accessor placeholder = "";
  @property({ type: Number }) accessor rows = 3;
  @property() accessor size: ScInputSize = "md";
  @property({ type: Boolean }) accessor disabled = false;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private _onInput = (e: Event): void => {
    e.stopPropagation();
    this.value = (e.target as HTMLTextAreaElement).value;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value }, bubbles: true, composed: true }),
    );
  };

  private _swallow = (e: Event): void => {
    e.stopPropagation();
  };

  render() {
    return html`<textarea
      class=${cx("sc-textarea", `sc-textarea--${this.size}`)}
      rows=${this.rows}
      placeholder=${this.placeholder}
      ?disabled=${this.disabled}
      .value=${live(this.value)}
      @input=${this._onInput}
      @change=${this._swallow}
    ></textarea>`;
  }
}
