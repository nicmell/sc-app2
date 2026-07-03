// <sc-button-base> — a UI-only button. Shadow DOM: renders the inner <button>
// (styled directly + keyed off the host's reflected `variant`/`size`),
// declarative content via `label` + optional leading/trailing Phosphor icons,
// plus an icon-only mode (a computed class on the button) and a `loading` spinner
// (takes the leading slot; the button is disabled while busy). `variant` here is button
// *appearance* (primary/secondary/ghost/danger), distinct from the accent `variant` on
// the input controls — so this does not extend ScControlBase. The inner button's
// `click` is composed, so it crosses the shadow boundary to consumers.

import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import type { ScSize } from "../internal/sc-control/sc-control";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-button.scss";
import "../sc-icon/sc-icon";

export type ScButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export class ScButtonBase extends LitElement {
  static styles = [resetStyles, styles];

  /** Button text + accessible name. Used as the aria-label when `iconOnly`. */
  @property() accessor label = "";
  /** Leading icon (Phosphor name, fill weight via <sc-icon-base>). */
  @property() accessor icon = "";
  /** Trailing icon (ignored when `iconOnly`). */
  @property({ attribute: "trailing-icon" }) accessor trailingIcon = "";
  /** Render only the icon (square button); `label` becomes the aria-label. */
  @property({ type: Boolean, attribute: "icon-only" }) accessor iconOnly = false;
  /** Busy state — a spinner takes the leading-icon slot; the button is disabled while busy. */
  @property({ type: Boolean }) accessor loading = false;
  @property({ reflect: true }) accessor variant: ScButtonVariant = "primary";
  @property({ reflect: true }) accessor size: ScSize = "md";
  @property({ type: Boolean }) accessor disabled = false;
  @property() accessor type: "button" | "submit" | "reset" = "button";

  render() {
    const iconOnly = this.iconOnly && !!this.icon;
    // The spinner takes the leading slot when loading — replacing the leading icon, or
    // appearing on its own when there's no icon; icon-only shows just the spinner.
    const lead = this.loading
      ? html`<span class=${cx("spinner", { lead: !iconOnly })} aria-hidden="true"></span>`
      : this.icon
        ? html`<sc-icon-base class=${cx("icon", { lead: !iconOnly })} name=${this.icon}></sc-icon-base>`
        : nothing;
    return html`
      <button
        class=${cx({ iconOnly })}
        type=${this.type}
        ?disabled=${this.disabled || this.loading}
        aria-busy=${this.loading ? "true" : nothing}
        aria-label=${iconOnly && this.label ? this.label : nothing}
      >
        ${lead}
        ${iconOnly
          ? nothing
          : this.label
            ? html`<span class="label">${this.label}</span>`
            : nothing}
        ${!iconOnly && this.trailingIcon
          ? html`<sc-icon-base class="icon trail" name=${this.trailingIcon}></sc-icon-base>`
          : nothing}
      </button>
    `;
  }
}
