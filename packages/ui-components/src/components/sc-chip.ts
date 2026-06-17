// <sc-chip-base> — a small rounded status label: a tinted pill with an
// optional leading status dot. Shadow DOM; `variant` resolves to a classnames
// modifier on the inner `.chip` span (sc-chip.styles.ts). Replaces the old
// `.status-pill`. neutral is the default.

import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { chipStyles } from "./sc-chip.styles";

export type ScChipVariant = "neutral" | "ok" | "warn" | "error" | "info";

export class ScChipBase extends LitElement {
  @property() accessor label = "";
  @property() accessor variant: ScChipVariant = "neutral";
  /** Show the leading status dot (tinted to match the variant). */
  @property({ type: Boolean }) accessor dot = false;

  static styles = [chipStyles];

  render() {
    const cls = cx("chip", { [`chip--${this.variant}`]: this.variant !== "neutral" });
    return html`<span class=${cls}
      >${this.dot ? html`<span class="chip__dot" aria-hidden="true">●</span>` : nothing}${this
        .label}</span
    >`;
  }
}
