// <sc-alert-base> — an inline alert/notice card. Shadow DOM: renders a `.root`
// (with the `variant` modifier; info is the base) wrapping a <slot> for the
// author's message. Sets the live-region role on the host (errors interrupt →
// role=alert; the rest are polite → role=status).

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-alert.css";

export type ScAlertVariant = "info" | "success" | "warn" | "error";

export class ScAlertBase extends LitElement {
  static styles = [foundations, styles];

  @property() accessor variant: ScAlertVariant = "info";

  protected updated(): void {
    this.setAttribute("role", this.variant === "error" ? "alert" : "status");
  }

  render() {
    return html`<div class=${cx("root", this.variant !== "info" && this.variant)}>
      <slot></slot>
    </div>`;
  }
}
