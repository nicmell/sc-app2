// <sc-stack-base> — vertical flex layout primitive (a "column of stacked
// things"). Light DOM and host-only: it renders NO template (default render()
// returns noChange), so the author's children are preserved untouched; the
// `gap` reflected prop selects the spacing (foundations/components/sc-stack.css),
// the same host-only pattern as <sc-text-base>. Shares its chrome with the
// legacy `.stack` class (kept for back-compat).

import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import "./sc-stack.css";

/** Spacing step — a clean monotonic scale mapping 1:1 to the space tokens:
 *  xs → --space-xs, sm → --space-sm, md → --space-md, lg → --space-lg
 *  (8 / 12 / 16 / 20px). `xs` is the default. The legacy `.stack--*`/
 *  `.cluster--*` classes share this scale (moved in lockstep). */
export type ScGap = "xs" | "sm" | "md" | "lg";

export class ScStackBase extends LitElement {
  @property({ reflect: true }) accessor gap: ScGap = "xs";

  /** Light DOM + no render() ⇒ the children stay; layout is by attribute. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }
}
