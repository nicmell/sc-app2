// <sc-stack-base> — vertical flex layout primitive (a "column of stacked
// things"). Shadow DOM: a `.root` flex column (with the `gap` modifier; xs is
// the base) wrapping a <slot> for the author's children.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-stack.css";

/** Spacing step — a clean monotonic scale mapping 1:1 to the space tokens:
 *  xs → --space-xs, sm → --space-sm, md → --space-md, lg → --space-lg
 *  (8 / 12 / 16 / 20px). `xs` is the default (the base, no modifier). */
export type ScGap = "xs" | "sm" | "md" | "lg";

export class ScStackBase extends LitElement {
  static styles = [foundations, styles];

  @property() accessor gap: ScGap = "xs";

  render() {
    return html`<div class=${cx("root", this.gap !== "xs" && this.gap)}>
      <slot></slot>
    </div>`;
  }
}
