// <sc-input-base> — a base text field. Shadow DOM: wraps a native <input> styled
// by the adopted foundations' bare input{} rules (surface fill, border, focus
// ring) plus a `.root` class for sizing. The native input/change are re-emitted
// (composed) from the host so consumers read `e.target.value`. The numeric field
// is <sc-inputnumber-base>.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-input.css";

export type ScInputSize = "sm" | "md" | "lg";

export class ScInputBase extends LitElement {
  static styles = [foundations, styles];

  @property() accessor value = "";
  @property() accessor placeholder = "";
  @property() accessor type = "text";
  @property() accessor name = "";
  @property() accessor size: ScInputSize = "md";
  @property({ type: Boolean }) accessor disabled = false;

  private _onInput = (e: Event): void => {
    e.stopPropagation();
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  };

  private _onChange = (e: Event): void => {
    e.stopPropagation();
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  render() {
    return html`<input
      class=${cx("root", this.size)}
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
