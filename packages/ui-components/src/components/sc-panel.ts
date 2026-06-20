// <sc-panel-base> — chrome wrapper for a feature surface (a surface-1 card with a
// subtle border, internal padding, and a gap-stacked column of children). A
// single direct-child <header> renders as a small uppercase title bar. Light DOM
// and host-only: it renders NO template (default render() returns noChange), so
// the author's header + content children are preserved. The `disabled` reflected
// prop mutes the card as "out of service".

import { LitElement } from "lit";
import { property } from "lit/decorators.js";

export class ScPanelBase extends LitElement {
  /** Idle / not-yet-active chrome: muted + non-interactive, layout preserved. */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  /** Light DOM + no render() ⇒ the header/content children stay; styling is by attribute. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }
}
