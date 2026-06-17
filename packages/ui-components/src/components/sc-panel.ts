// <sc-panel-base> — chrome wrapper for a feature surface (a surface-1 card with a
// subtle border, internal padding, and a gap-stacked column of children). Shadow
// DOM: slots the author's header + content; a slotted direct-child <header>
// renders as a small uppercase title bar (::slotted(header), sc-panel.styles.ts).
// The `disabled` reflected prop mutes the card as "out of service".

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { panelStyles } from "./sc-panel.styles";

export class ScPanelBase extends LitElement {
  /** Idle / not-yet-active chrome: muted + non-interactive, layout preserved. */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  static styles = [panelStyles];

  render() {
    return html`<slot></slot>`;
  }
}
