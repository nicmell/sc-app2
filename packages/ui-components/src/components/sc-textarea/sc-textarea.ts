// <sc-textarea-base> — a multi-line text field. Shadow DOM: wraps a native
// <textarea> styled by `controlStyles` (sans font, vertical resize, surface fill,
// focus ring); it fills the host and the reflected `size` scales it via
// `:host([size]) textarea`. The native input/change are re-emitted (composed) from
// the host so consumers read `e.target.value`.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScControlBase } from "../internal/sc-control/sc-control";
import resetStyles from "../../foundations/reset.scss";
import controlStyles from "../../foundations/controls.scss";
import styles from "./sc-textarea.scss";

export class ScTextareaBase extends ScControlBase {
  static styles = [resetStyles, controlStyles, styles];

  @property() accessor value = "";
  @property() accessor placeholder = "";
  @property({ type: Number }) accessor rows = 3;

  private _onInput = (e: Event): void => {
    e.stopPropagation();
    this.value = (e.target as HTMLTextAreaElement).value;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  };

  private _onChange = (e: Event): void => {
    e.stopPropagation();
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  render() {
    return html`<textarea
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
