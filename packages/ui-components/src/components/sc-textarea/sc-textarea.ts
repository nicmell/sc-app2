// <sc-textarea-base> — a multi-line text field. Light DOM, wrapping a native
// <textarea> styled by the foundation (sans font, vertical resize, surface
// fill, focus ring) plus a `.sc-textarea` class for sizing/full-width. The
// native input/change flow to consumers (read e.target.value); the component
// just mirrors the value onto its `value` property.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import cx from "classnames";
import type { ScInputSize } from "../sc-input/sc-input";
import styles from "./sc-textarea.module.css";

export class ScTextareaBase extends LitElement {
  @property() accessor value = "";
  @property() accessor placeholder = "";
  @property() accessor name = "";
  @property({ type: Number }) accessor rows = 3;
  @property() accessor size: ScInputSize = "md";
  @property({ type: Boolean }) accessor disabled = false;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private _onInput = (e: Event): void => {
    this.value = (e.target as HTMLTextAreaElement).value;
  };

  render() {
    return html`<textarea
      class=${cx(styles.root, styles[this.size])}
      rows=${this.rows}
      name=${this.name}
      placeholder=${this.placeholder}
      ?disabled=${this.disabled}
      .value=${live(this.value)}
      @input=${this._onInput}
    ></textarea>`;
  }
}
