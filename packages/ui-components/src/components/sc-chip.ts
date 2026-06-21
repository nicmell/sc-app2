// <sc-chip-base> — a small rounded status label: a tinted pill with an
// optional leading status dot. Light DOM; `variant` resolves to a classnames
// modifier. Replaces the old `.status-pill` (which was just a chip that always
// showed a dot). neutral is the default (the base `.sc-chip`).

import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";

export type ScChipVariant = "neutral" | "ok" | "warn" | "error" | "info";

export class ScChipBase extends LitElement {
  @property() accessor label = "";
  @property() accessor variant: ScChipVariant = "neutral";
  /** Show the leading status dot (tinted to match the variant). */
  @property({ type: Boolean }) accessor dot = false;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  render() {
    const cls = cx("sc-chip", { [`sc-chip--${this.variant}`]: this.variant !== "neutral" });
    return html`<span class=${cls}
      >${this.dot ? html`<span class="sc-chip__dot" aria-hidden="true">●</span>` : nothing}${this
        .label}</span
    >`;
  }
}
