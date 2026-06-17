// <sc-stack-base> — vertical flex layout primitive (a "column of stacked
// things"). Shadow DOM: slots the author's children; the `gap` reflected prop
// selects the spacing (`:host([gap=…])`, sc-stack.styles.ts).

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { stackStyles } from "./sc-stack.styles";

/** Spacing step — a clean monotonic scale mapping 1:1 to the space tokens:
 *  xs → --space-xs, sm → --space-sm, md → --space-md, lg → --space-lg
 *  (8 / 12 / 16 / 20px). `xs` is the default. */
export type ScGap = "xs" | "sm" | "md" | "lg";

export class ScStackBase extends LitElement {
  @property({ reflect: true }) accessor gap: ScGap = "xs";

  static styles = [stackStyles];

  render() {
    return html`<slot></slot>`;
  }
}
