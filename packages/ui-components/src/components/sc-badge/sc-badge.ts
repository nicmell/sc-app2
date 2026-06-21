// <sc-badge-base> — an uppercase pill label. Light DOM, declarative `label`,
// colour `variant` resolved to a scoped CSS-module class. ok is the default
// (the base `styles.root`); the component imports its own stylesheet.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import styles from "./sc-badge.module.css";

export type ScBadgeVariant = "ok" | "warn" | "error";

export class ScBadgeBase extends LitElement {
  @property() accessor label = "";
  @property() accessor variant: ScBadgeVariant = "ok";

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  render() {
    const cls = cx(styles.root, {
      [styles.warn]: this.variant === "warn",
      [styles.error]: this.variant === "error",
    });
    return html`<span class=${cls}>${this.label}</span>`;
  }
}
