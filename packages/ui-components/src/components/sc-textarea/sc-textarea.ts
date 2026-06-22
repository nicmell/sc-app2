// <sc-textarea-base> — a multi-line text field. Shadow DOM: wraps a native
// <textarea> styled by the adopted foundations (sans font, vertical resize,
// surface fill, focus ring) plus a `.root` class for sizing/full-width. The
// native input/change are re-emitted (composed) from the host so consumers read
// `e.target.value`.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import cx from "classnames";
import type { ScInputSize } from "../sc-input/sc-input";
import { foundations } from "../internal/foundation-styles";
import { relay } from "../internal/events";
import { styles } from "./sc-textarea.styles";

export class ScTextareaBase extends LitElement {
  static styles = [foundations, styles];

  @property() accessor value = "";
  @property() accessor placeholder = "";
  @property() accessor name = "";
  @property({ type: Number }) accessor rows = 3;
  @property() accessor size: ScInputSize = "md";
  @property({ type: Boolean }) accessor disabled = false;

  private _onInput = (e: Event): void => {
    this.value = (e.target as HTMLTextAreaElement).value;
    relay(this, e, "input");
  };

  private _onChange = (e: Event): void => {
    relay(this, e, "change");
  };

  render() {
    return html`<textarea
      class=${cx("root", this.size)}
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
