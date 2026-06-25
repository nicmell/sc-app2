// <sc-stack-base> — vertical flex layout primitive (a "column of stacked
// things"). Shadow DOM: `:host` is the flex column (with the reflected `gap`
// modifier; xs is the base) wrapping a <slot> for the author's children.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-stack.scss";

/** Spacing step — a clean monotonic scale mapping 1:1 to the space tokens:
 *  xs → --space-xs, sm → --space-sm, md → --space-md, lg → --space-lg
 *  (8 / 12 / 16 / 20px). `xs` is the default (the base). */
export type ScGap = "xs" | "sm" | "md" | "lg";

export class ScStackBase extends LitElement {
  static styles = [foundations, styles];

  @property({ reflect: true }) accessor gap: ScGap = "xs";

  render() {
    return html`<slot></slot>`;
  }
}
