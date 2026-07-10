// <sc-base-col> — one cell in sc-base-row's 24-unit grid. Reflected layout
// props are consumed directly by the shared stylesheet.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-col.scss";

export const scColLayoutStyles = styles;

export class ScColBase extends LitElement {
  static styles = [resetStyles, styles];

  @property({ type: Number, reflect: true }) accessor span: number | undefined;
  @property({ type: Number, reflect: true }) accessor offset: number | undefined;
  @property({ type: Number, reflect: true }) accessor order: number | undefined;

  render() {
    return html`<slot></slot>`;
  }
}
