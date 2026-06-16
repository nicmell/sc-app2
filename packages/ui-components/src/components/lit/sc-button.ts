// <sc-button-base> — a UI-only button. Light DOM (so the inner <button>
// participates in forms and the foundation classes apply), declarative content
// via `label` + optional leading/trailing Phosphor icons, plus an icon-only
// mode. `variant` here is button *appearance* (primary/secondary/ghost/danger),
// distinct from the accent `variant` on the input widgets — so this does not
// extend ScInputBase. Click is the native event bubbling from the inner button;
// no custom event is dispatched.

import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import type { ScSize } from "./internal/sc-input-base";

export type ScButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export class ScButtonBase extends LitElement {
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

  /** Light DOM so the inner <button> joins any enclosing form + global CSS. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  render() {
    const iconOnly = this.iconOnly && !!this.icon;
    const cls = cx("sc-button", `sc-button--${this.variant}`, `sc-button--${this.size}`, {
      "sc-button--icon": iconOnly,
    });
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
            ? html`<span class="sc-button__label">${this.label}</span>`
            : nothing}
        ${!iconOnly && this.trailingIcon
          ? html`<sc-icon-base name=${this.trailingIcon}></sc-icon-base>`
          : nothing}
      </button>
    `;
  }
}
