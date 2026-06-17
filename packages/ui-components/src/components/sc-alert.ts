// <sc-alert-base> — an inline alert/notice card. Light DOM and host-only: it
// renders NO template (LitElement's default render() returns noChange), so the
// author's message/inline children are preserved untouched. The colour `variant`
// is a reflected prop → attribute selector (foundations/components/error-alert.css),
// the same host-only pattern as <sc-text-base>. Generalises the legacy `.error`
// class (which stays for back-compat) to the full state palette.

import { LitElement } from "lit";
import { property } from "lit/decorators.js";

export type ScAlertVariant = "info" | "success" | "warn" | "error";

export class ScAlertBase extends LitElement {
  @property({ reflect: true }) accessor variant: ScAlertVariant = "info";

  /** Light DOM + no render() ⇒ the message children stay; styling is by attribute. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  // Announce to assistive tech when the alert appears / its text changes:
  // errors interrupt (role=alert, assertive); the rest are polite (role=status).
  protected updated(): void {
    this.setAttribute("role", this.variant === "error" ? "alert" : "status");
  }
}
