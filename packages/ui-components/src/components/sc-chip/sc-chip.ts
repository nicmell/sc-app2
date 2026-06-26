// <sc-chip-base> — a small rounded status label: a tinted pill with an optional
// leading status dot. Shadow DOM: `:host` is the pill carrying the `label`, with the
// `variant` reflected (neutral is the base) and an opt-in leading dot.

import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-chip.scss";

export type ScChipVariant = "neutral" | "ok" | "warn" | "error" | "info";

export class ScChipBase extends LitElement {
  static styles = [resetStyles, styles];

  @property() accessor label = "";
  @property({ reflect: true }) accessor variant: ScChipVariant = "neutral";
  /** Show the leading status dot (tinted to match the variant). */
  @property({ type: Boolean }) accessor dot = false;

  render() {
    return html`${this.dot ? html`<span class="dot" aria-hidden="true">●</span>` : nothing}${this
      .label}`;
  }
}
