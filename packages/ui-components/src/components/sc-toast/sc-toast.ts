// <sc-toast-base> — a single notification card (message + dismiss button) with a
// per-variant left accent. Shadow DOM: `:host` is the card (reflected `variant`).
// Dismiss dispatches a composed `dismiss` CustomEvent; the owner removes it.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-toast.scss";
import "../sc-icon/sc-icon";

export type ScToastVariant = "default" | "success" | "warn" | "error" | "info";

export class ScToastBase extends LitElement {
  static styles = [resetStyles, styles];

  @property() accessor message = "";
  @property({ reflect: true }) accessor variant: ScToastVariant = "default";

  private _dismiss = (): void => {
    this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, composed: true }));
  };

  protected updated(): void {
    // Errors/warnings interrupt (assertive); info/success/default are polite.
    this.setAttribute("role", this.variant === "error" || this.variant === "warn" ? "alert" : "status");
  }

  render() {
    return html`
      <span class="message">${this.message}</span>
      <button type="button" class="close" aria-label="Dismiss" @click=${this._dismiss}>
        <sc-icon-base name="x"></sc-icon-base>
      </button>
    `;
  }
}
