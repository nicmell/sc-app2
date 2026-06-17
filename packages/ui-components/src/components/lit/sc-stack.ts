// <sc-stack-base> — vertical flex layout primitive (a "column of stacked
// things"). Light DOM and host-only: it renders NO template (default render()
// returns noChange), so the author's children are preserved untouched; the
// `gap` reflected prop selects the spacing (foundations/components/stack.css),
// the same host-only pattern as <sc-text-base>. Shares its chrome with the
// legacy `.stack` class (kept for back-compat).

import { LitElement } from "lit";
import { property } from "lit/decorators.js";

/** Spacing step. Mirrors the legacy `.stack--*`/`.cluster--*` scale exactly;
 *  unset = the base gap. */
export type ScGap = "sm" | "md" | "lg";

export class ScStackBase extends LitElement {
  @property({ reflect: true }) accessor gap: ScGap | undefined = undefined;

  /** Light DOM + no render() ⇒ the children stay; layout is by attribute. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }
}
