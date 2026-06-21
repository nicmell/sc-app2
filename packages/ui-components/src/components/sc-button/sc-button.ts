// <sc-button-base> — a UI-only button. Shadow DOM: renders the inner <button>
// (styled by the adopted foundations' bare button{} + its own `.root` chrome),
// declarative content via `label` + optional leading/trailing Phosphor icons,
// plus an icon-only mode. `variant` here is button *appearance*
// (primary/secondary/ghost/danger), distinct from the accent `variant` on the
// input widgets — so this does not extend ScWidgetBase. The inner button's
// `click` is composed, so it crosses the shadow boundary to consumers.

import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import type { ScSize } from "../internal/sc-widget-base";
import { foundations } from "../internal/foundation-styles";
import { styles } from "./sc-button.styles";
import "../sc-icon/sc-icon";

export type ScButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export class ScButtonBase extends LitElement {
  static styles = [foundations, styles];

  /** Button text + accessible name. Used as the aria-label when `iconOnly`. */
  @property() accessor label = "";
  /** Leading icon (Phosphor name, fill weight via <sc-icon-base>). */
  @property() accessor icon = "";
  /** Trailing icon (ignored when `iconOnly`). */
  @property({ attribute: "trailing-icon" }) accessor trailingIcon = "";
  /** Render only the icon (square button); `label` becomes the aria-label. */
  @property({ type: Boolean, attribute: "icon-only" }) accessor iconOnly = false;
  @property() accessor variant: ScButtonVariant = "primary";
  @property() accessor size: ScSize = "md";
  @property({ type: Boolean }) accessor disabled = false;
  @property() accessor type: "button" | "submit" | "reset" = "button";

  render() {
    const iconOnly = this.iconOnly && !!this.icon;
    const cls = cx("root", this.variant, this.size, { iconOnly });
    return html`
      <button
        class=${cls}
        type=${this.type}
        ?disabled=${this.disabled}
        aria-label=${iconOnly && this.label ? this.label : nothing}
      >
        ${this.icon ? html`<sc-icon-base name=${this.icon}></sc-icon-base>` : nothing}
        ${iconOnly
          ? nothing
          : this.label
            ? html`<span class="label">${this.label}</span>`
            : nothing}
        ${!iconOnly && this.trailingIcon
          ? html`<sc-icon-base name=${this.trailingIcon}></sc-icon-base>`
          : nothing}
      </button>
    `;
  }
}
