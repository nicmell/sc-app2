// <sc-input-base> — a base text field. Shadow DOM: wraps a native <input> styled
// by `controlStyles` (the shared bare input{} chrome: surface fill, border, focus
// ring) plus a `.root` class for sizing. The native input/change are re-emitted
// (composed) from the host so consumers read `e.target.value`. The numeric field
// is <sc-inputnumber-base>.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScControlBase } from "../internal/sc-control/sc-control";
import resetStyles from "../../foundations/reset.scss";
import controlStyles from "../../foundations/base/controls.scss";
import styles from "./sc-input.scss";

export class ScInputBase extends ScControlBase {
  static styles = [resetStyles, controlStyles, styles];

  @property() accessor value = "";
  @property() accessor placeholder = "";
  @property() accessor type = "text";

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
