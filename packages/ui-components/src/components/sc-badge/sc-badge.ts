// <sc-badge-base> — an uppercase pill label. Shadow DOM: `:host` is the pill carrying
// the declarative `label`, with the colour `variant` reflected (ok is the base).

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-badge.scss";

export type ScBadgeVariant = "ok" | "warn" | "error";

export class ScBadgeBase extends LitElement {
  static styles = [foundations, styles];

  @property() accessor label = "";
  @property({ reflect: true }) accessor variant: ScBadgeVariant = "ok";

  render() {
    return html`${this.label}`;
  }
}
