// <sc-badge-base> — an uppercase pill label. Shadow DOM; declarative `label`,
// colour `variant` resolved to a classnames modifier on the inner `.badge`
// span (sc-badge.styles.ts). ok is the default.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { badgeStyles } from "./sc-badge.styles";

export type ScBadgeVariant = "ok" | "warn" | "error";

export class ScBadgeBase extends LitElement {
  @property() accessor label = "";
  @property() accessor variant: ScBadgeVariant = "ok";

  static styles = [badgeStyles];

  render() {
    const cls = cx("badge", { [`badge--${this.variant}`]: this.variant !== "ok" });
    return html`<span class=${cls}>${this.label}</span>`;
  }
}
