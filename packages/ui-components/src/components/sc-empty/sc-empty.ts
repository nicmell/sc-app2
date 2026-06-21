// <sc-empty-base> — placeholder shown when a list/collection has no items yet
// (dashed border, muted text, centred). Light DOM and host-only: it renders NO
// template (default render() returns noChange), so the author's message/inline
// children are preserved; it applies its scoped `styles.root` class to the host.

import { LitElement } from "lit";
import { syncHostClasses } from "../internal/host-classes";
import styles from "./sc-empty.module.css";

export class ScEmptyBase extends LitElement {
  /** Light DOM + no render() ⇒ the message children stay; styling is on the host. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  readonly #cls = new Set<string>();
  protected updated(): void {
    syncHostClasses(this, this.#cls, [styles.root]);
  }
}
