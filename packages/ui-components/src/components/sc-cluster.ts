// <sc-cluster-base> — horizontal flex layout primitive (a "row of inline
// things": toolbars, label + input, chip + readout). Centred cross-axis, wraps.
// Light DOM and host-only: it renders NO template (default render() returns
// noChange), so the author's children are preserved; the `gap` reflected prop
// selects the spacing (foundations/components/sc-cluster.css). Shares its chrome
// with the legacy `.cluster` class (kept for back-compat). Reuses ScGap.

import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { ScGap } from "./sc-stack";
import "./sc-cluster.css";

export class ScClusterBase extends LitElement {
  @property({ reflect: true }) accessor gap: ScGap = "xs";

  /** Light DOM + no render() ⇒ the children stay; layout is by attribute. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }
}
