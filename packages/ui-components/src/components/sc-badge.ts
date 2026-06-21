// <sc-badge-base> — an uppercase pill label. Light DOM, declarative `label`,
// colour `variant` resolved to a classnames modifier (replacing the old
// .badge[data-variant]). ok is the default (the base `.sc-badge`).

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";

export type ScBadgeVariant = "ok" | "warn" | "error";

export class ScBadgeBase extends LitElement {
  @property() accessor label = "";
  @property() accessor variant: ScBadgeVariant = "ok";

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  render() {
    const cls = cx("sc-badge", { [`sc-badge--${this.variant}`]: this.variant !== "ok" });
    return html`<span class=${cls}>${this.label}</span>`;
  }
}
