// <sc-textarea-base> — a multi-line text field. Shadow DOM, owning the chrome
// via Lit `css` (sc-textarea.styles.ts; sans font, vertical resize, surface
// fill, focus ring + sizing). The native input/change flow to consumers (read
// e.target.value); the component mirrors the value onto `value`. Form-associated
// (ElementInternals) so it still submits in a <form> under its `name`.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import cx from "classnames";
import type { ScInputSize } from "./sc-input";
import { resetStyles } from "./internal/reset.styles";
import { textareaStyles } from "./sc-textarea.styles";

export class ScTextareaBase extends LitElement {
  static formAssociated = true;

  @property() accessor value = "";
  @property() accessor placeholder = "";
  @property({ reflect: true }) accessor name = "";
  @property({ type: Number }) accessor rows = 3;
  @property() accessor size: ScInputSize = "md";
  @property({ type: Boolean }) accessor disabled = false;

  static styles = [resetStyles, textareaStyles];

  readonly #internals: ElementInternals | undefined = (() => {
    try {
      return this.attachInternals();
    } catch {
      return undefined;
    }
  })();

  private _onInput = (e: Event): void => {
    this.value = (e.target as HTMLTextAreaElement).value;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  };
  private _onChange = (): void => {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  protected updated(): void {
    this.#internals?.setFormValue(this.value);
  }

  render() {
    return html`<textarea
      class=${cx("sc-textarea", `sc-textarea--${this.size}`)}
      rows=${this.rows}
      name=${this.name}
      placeholder=${this.placeholder}
      ?disabled=${this.disabled}
      .value=${live(this.value)}
      @input=${this._onInput}
      @change=${this._onChange}
    ></textarea>`;
  }
}
