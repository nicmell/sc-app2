// <sc-toast-base> — a single notification card (message + dismiss button) with
// a per-variant left accent. Shadow DOM; owns its styles via Lit `css`
// (sc-toast.styles.ts). The fixed-position `.toast-stack` container stays an
// app/global class — a toast just lives inside it. Dismiss dispatches a
// `dismiss` CustomEvent (composed); the owner removes it.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { resetStyles } from "./internal/reset.styles";
import { toastStyles } from "./sc-toast.styles";

export type ScToastVariant = "default" | "success" | "warn" | "error" | "info";

export class ScToastBase extends LitElement {
  @property() accessor message = "";
  @property() accessor variant: ScToastVariant = "default";

  static styles = [resetStyles, toastStyles];

  private _dismiss = (): void => {
    this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, composed: true }));
  };

  render() {
    const cls = cx("toast", { [`toast--${this.variant}`]: this.variant !== "default" });
    // Errors/warnings interrupt (assertive); info/success/default are polite.
    const role = this.variant === "error" || this.variant === "warn" ? "alert" : "status";
    return html`
      <div class=${cls} role=${role}>
        <span class="toast-message">${this.message}</span>
        <button type="button" class="toast-close" aria-label="Dismiss" @click=${this._dismiss}>
          ×
        </button>
      </div>
    `;
  }
}
