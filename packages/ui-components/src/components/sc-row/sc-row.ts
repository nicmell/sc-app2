// <sc-base-row> — the container half of the 24-unit grid. Only sc-base-col
// should be direct children. Gutter is tokenized; columns inherit it and own
// their half-padding, while the row offsets the outer halves.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import type { ScFlexJustify, ScGap } from "../sc-flex/sc-flex";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-row.scss";

export type ScRowAlign = "top" | "middle" | "bottom" | "stretch";

export class ScRowBase extends LitElement {
  static styles = [resetStyles, styles];

  @property({ reflect: true }) accessor align: ScRowAlign = "top";
  @property({ reflect: true }) accessor justify: ScFlexJustify = "start";
  @property({ reflect: true }) accessor gutter: ScGap = "none";
  @property({ type: Boolean, reflect: true }) accessor wrap = true;

  protected updated(): void {
    this.style.setProperty("--sc-row-wrap", this.wrap ? "wrap" : "nowrap");
  }

  render() {
    return html`<slot></slot>`;
  }
}
