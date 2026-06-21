// <sc-panel-base> — chrome wrapper for a feature surface (a surface-1 card with a
// subtle border, internal padding, and a gap-stacked column of children). A
// single direct-child <header> renders as a small uppercase title bar. Light DOM
// and host-only: it renders NO template (default render() returns noChange), so
// the author's header + content children are preserved; it applies its scoped
// `styles.root` (+ `disabled`) class to the host. The author's <header> is
// styled structurally (`.root > header` in the module).

import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import { syncHostClasses } from "../internal/host-classes";
import styles from "./sc-panel.module.css";

export class ScPanelBase extends LitElement {
  /** Idle / not-yet-active chrome: muted + non-interactive, layout preserved. */
  @property({ type: Boolean }) accessor disabled = false;

  /** Light DOM + no render() ⇒ the header/content children stay; styling is by host class. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  readonly #cls = new Set<string>();
  protected updated(): void {
    syncHostClasses(this, this.#cls, [styles.root, this.disabled && styles.disabled]);
  }
}
