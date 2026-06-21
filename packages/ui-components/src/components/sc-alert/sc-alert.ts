// <sc-alert-base> — an inline alert/notice card. Light DOM and host-only: it
// renders NO template (LitElement's default render() returns noChange), so the
// author's message/inline children are preserved untouched. It applies its
// scoped `styles.root` + a `variant` modifier class to the host (info is the
// base) and sets the live-region role.

import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import { syncHostClasses } from "../internal/host-classes";
import styles from "./sc-alert.module.css";

export type ScAlertVariant = "info" | "success" | "warn" | "error";

export class ScAlertBase extends LitElement {
  @property() accessor variant: ScAlertVariant = "info";

  /** Light DOM + no render() ⇒ the message children stay; styling is by host class. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  readonly #cls = new Set<string>();
  // Style the host via classes; announce to assistive tech (errors interrupt
  // → role=alert/assertive; the rest are polite → role=status).
  protected updated(): void {
    syncHostClasses(this, this.#cls, [styles.root, styles[this.variant]]);
    this.setAttribute("role", this.variant === "error" ? "alert" : "status");
  }
}
