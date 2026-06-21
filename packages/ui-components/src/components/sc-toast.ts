// <sc-toast-base> — a single notification card (message + dismiss button) with
// a per-variant left accent. Light DOM; `variant` resolves to a classnames
// modifier (replacing the old .toast[data-variant]). The fixed-position
// `.sc-toast-stack` container stays a plain layout class — a toast just lives
// inside it. Dismiss dispatches a `dismiss` CustomEvent; the owner removes it.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";

export type ScToastVariant = "default" | "success" | "warn" | "error" | "info";

export class ScToastBase extends LitElement {
  @property() accessor message = "";
  @property() accessor variant: ScToastVariant = "default";

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private _dismiss = (): void => {
    this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, composed: true }));
  };

  render() {
    const cls = cx("sc-toast", { [`sc-toast--${this.variant}`]: this.variant !== "default" });
    // Errors/warnings interrupt (assertive); info/success/default are polite.
    const role = this.variant === "error" || this.variant === "warn" ? "alert" : "status";
    return html`
      <div class=${cls} role=${role}>
        <span class="sc-toast__message">${this.message}</span>
        <button type="button" class="sc-toast__close" aria-label="Dismiss" @click=${this._dismiss}>
          ×
        </button>
      </div>
    `;
  }
}
