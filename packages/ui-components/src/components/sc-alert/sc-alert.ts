// <sc-alert-base> — an inline alert/notice card. Shadow DOM: `:host` is the card (with
// the reflected `variant` modifier; info is the base) over a <slot> for the author's
// message. Sets the live-region role on the host (errors interrupt → role=alert; the
// rest are polite → role=status).

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-alert.scss";

export type ScAlertVariant = "info" | "success" | "warn" | "error";

export class ScAlertBase extends LitElement {
  static styles = [resetStyles, styles];

  @property({ reflect: true }) accessor variant: ScAlertVariant = "info";

  protected updated(): void {
    this.setAttribute("role", this.variant === "error" ? "alert" : "status");
  }

  render() {
    return html`<slot></slot>`;
  }
}
