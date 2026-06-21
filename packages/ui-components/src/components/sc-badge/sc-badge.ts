// <sc-badge-base> — an uppercase pill label. Shadow DOM: a `.root` span carrying
// the declarative `label`, with the colour `variant` as a class (ok is the base).

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
import { styles } from "./sc-badge.styles";

export type ScBadgeVariant = "ok" | "warn" | "error";

export class ScBadgeBase extends LitElement {
  static styles = [foundations, styles];

  @property() accessor label = "";
  @property() accessor variant: ScBadgeVariant = "ok";

  render() {
    return html`<span class=${cx("root", this.variant !== "ok" && this.variant)}
      >${this.label}</span
    >`;
  }
}
