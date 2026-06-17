// <sc-alert-base> — an inline alert/notice card. Shadow DOM: slots the author's
// message; the colour `variant` is a reflected prop → `:host([variant=…])`
// (sc-alert.styles.ts). Owns its styles via Lit `css`; tokens inherit from :root.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { alertStyles } from "./sc-alert.styles";

export type ScAlertVariant = "info" | "success" | "warn" | "error";

export class ScAlertBase extends LitElement {
  @property({ reflect: true }) accessor variant: ScAlertVariant = "info";

  static styles = [alertStyles];

  // Announce to assistive tech when the alert appears / its text changes:
  // errors interrupt (role=alert, assertive); the rest are polite (role=status).
  protected updated(): void {
    this.setAttribute("role", this.variant === "error" ? "alert" : "status");
  }

  render() {
    return html`<slot></slot>`;
  }
}
