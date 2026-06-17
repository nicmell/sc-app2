// <sc-empty-base> — placeholder shown when a list/collection has no items yet
// (dashed border, muted text, centred). Light DOM and host-only: it renders NO
// template (default render() returns noChange), so the author's message/inline
// children are preserved. Wraps the legacy `.empty` class (kept for back-compat).

import { LitElement } from "lit";

export class ScEmptyBase extends LitElement {
  /** Light DOM + no render() ⇒ the message children stay; styling is on the host. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }
}
