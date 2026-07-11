// <sc-base-flex> — neutral flexbox layout primitive. The host is the flex
// container, so slotted children remain direct flex items with no wrappers.
// Reflected attributes expose the useful flex axes while gaps stay on the
// design-system spacing scale.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-flex.scss";

export type ScFlexOrientation = "horizontal" | "vertical";
export type ScFlexJustify =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around"
  | "space-evenly";
export type ScFlexAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type ScGap = "none" | "xs" | "sm" | "md" | "lg";

export class ScFlexBase extends LitElement {
  static styles = [resetStyles, styles];

  @property({ reflect: true }) accessor orientation: ScFlexOrientation = "horizontal";
  @property({ type: Boolean, reflect: true }) accessor wrap = false;
  @property({ reflect: true }) accessor justify: ScFlexJustify = "start";
  @property({ reflect: true }) accessor align: ScFlexAlign = "stretch";
  @property({ reflect: true }) accessor gap: ScGap = "none";

  render() {
    return html`<slot></slot>`;
  }
}
