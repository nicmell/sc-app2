// <sc-base-row> — the container half of the native 24-track grid. Only
// sc-base-col should be direct children.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import type { ScGap } from "../sc-flex/sc-flex";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-row.scss";

export type ScRowAlign = "top" | "middle" | "bottom" | "stretch";

export class ScRowBase extends LitElement {
  static styles = [resetStyles, styles];

  @property({ reflect: true }) accessor align: ScRowAlign = "top";
  @property({ reflect: true }) accessor gutter: ScGap = "none";

  render() {
    return html`<slot></slot>`;
  }
}
