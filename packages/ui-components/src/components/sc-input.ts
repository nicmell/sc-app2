// <sc-input-base> — a base text field. Shadow DOM, owning the field chrome via
// Lit `css` (sc-input.styles.ts). The native input/change flow to consumers
// (read e.target.value); the component mirrors the value onto `value`. It's a
// form-associated custom element (ElementInternals) so it still submits in a
// <form> under its `name`. The numeric field is <sc-inputnumber-base>.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import cx from "classnames";
import { resetStyles } from "./internal/reset.styles";
import { inputStyles } from "./sc-input.styles";

export type ScInputSize = "sm" | "md" | "lg";

export class ScInputBase extends LitElement {
  static formAssociated = true;

  @property() accessor value = "";
  @property() accessor placeholder = "";
  @property() accessor type = "text";
  @property({ reflect: true }) accessor name = "";
  @property() accessor size: ScInputSize = "md";
  @property({ type: Boolean }) accessor disabled = false;

  static styles = [resetStyles, inputStyles];

  // Guarded — some non-browser test envs lack attachInternals.
  readonly #internals: ElementInternals | undefined = (() => {
    try {
      return this.attachInternals();
    } catch {
      return undefined;
    }
  })();

  // Mirror the native value + re-emit composed input/change (native input events
  // don't cross the shadow boundary, so host listeners would otherwise miss them).
  private _onInput = (e: Event): void => {
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  };
  private _onChange = (): void => {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  protected updated(): void {
    this.#internals?.setFormValue(this.value);
  }

  render() {
    return html`<input
      class=${cx("sc-input", `sc-input--${this.size}`)}
      type=${this.type}
      name=${this.name}
      placeholder=${this.placeholder}
      ?disabled=${this.disabled}
      .value=${live(this.value)}
      @input=${this._onInput}
      @change=${this._onChange}
    />`;
  }
}
