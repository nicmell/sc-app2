// <sc-chip-base> — a small rounded status label: a tinted pill with an optional
// leading status dot. Shadow DOM: a `.root` span carrying the `label`, with the
// `variant` as a class (neutral is the base) and an opt-in leading dot.

import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-chip.scss";

export type ScChipVariant = "neutral" | "ok" | "warn" | "error" | "info";

export class ScChipBase extends LitElement {
  static styles = [foundations, styles];

  @property() accessor label = "";
  @property() accessor variant: ScChipVariant = "neutral";
  /** Show the leading status dot (tinted to match the variant). */
  @property({ type: Boolean }) accessor dot = false;

  render() {
    return html`<span class=${cx("root", this.variant !== "neutral" && this.variant)}
      >${this.dot ? html`<span class="dot" aria-hidden="true">●</span>` : nothing}${this
        .label}</span
    >`;
  }
}
