// <sc-toast-base> — a single notification card (message + dismiss button) with a
// per-variant left accent. Shadow DOM: a `.root` carrying the `variant` class.
// Dismiss dispatches a composed `dismiss` CustomEvent; the owner removes it.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
import { styles } from "./sc-toast.styles";

export type ScToastVariant = "default" | "success" | "warn" | "error" | "info";

export class ScToastBase extends LitElement {
  static styles = [foundations, styles];

  @property() accessor message = "";
  @property() accessor variant: ScToastVariant = "default";

  private _dismiss = (): void => {
    this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, composed: true }));
  };

  render() {
    // Errors/warnings interrupt (assertive); info/success/default are polite.
    const role = this.variant === "error" || this.variant === "warn" ? "alert" : "status";
    return html`
      <div class=${cx("root", this.variant !== "default" && this.variant)} role=${role}>
        <span class="message">${this.message}</span>
        <button type="button" class="close" aria-label="Dismiss" @click=${this._dismiss}>×</button>
      </div>
    `;
  }
}
