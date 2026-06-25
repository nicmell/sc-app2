// <sc-panel-base> — chrome wrapper for a feature surface (a surface-1 card with a
// subtle border, internal padding, and a gap-stacked column of children). Shadow
// DOM: `:host` is the card over a <slot>; a slotted direct-child <header> becomes the
// title bar (::slotted in the styles). `disabled` (reflected) mutes the card.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-panel.scss";

export class ScPanelBase extends LitElement {
  static styles = [foundations, styles];

  /** Idle / not-yet-active chrome: muted + non-interactive, layout preserved. */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  render() {
    return html`<slot></slot>`;
  }
}
