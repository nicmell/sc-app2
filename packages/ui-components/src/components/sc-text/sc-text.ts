// <sc-text-base> — the typography primitive. Light DOM and host-only: it
// renders NO template (LitElement's default render() returns noChange), so the
// author's text/inline children are preserved untouched. It applies scoped
// `styles.root` + size/weight/tone/font/align/truncate/inline modifier classes
// to the host; the defaults (md / regular / sans / default tone / start) are the
// base `root` rule (no modifier).

import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import { syncHostClasses } from "../internal/host-classes";
import styles from "./sc-text.module.css";

export type ScTextSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ScTextWeight = "regular" | "medium" | "bold";
export type ScTextTone =
  | "default"
  | "dim"
  | "mute"
  | "faint"
  | "primary"
  | "ok"
  | "warn"
  | "error"
  | "info";
export type ScTextFont = "sans" | "mono";
export type ScTextAlign = "start" | "center" | "end";

export class ScTextBase extends LitElement {
  @property() accessor size: ScTextSize = "md";
  @property() accessor weight: ScTextWeight = "regular";
  @property() accessor tone: ScTextTone = "default";
  @property() accessor font: ScTextFont = "sans";
  @property() accessor align: ScTextAlign = "start";
  /** Single-line clip with an ellipsis. */
  @property({ type: Boolean }) accessor truncate = false;
  /** Flow inline (default is a block). */
  @property({ type: Boolean }) accessor inline = false;

  /** Light DOM + no render() ⇒ the text children stay; styling is by host class. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  readonly #cls = new Set<string>();
  protected updated(): void {
    // Defaults (md/regular/default/sans/start) have no modifier class → the
    // lookups return undefined and are skipped.
    syncHostClasses(this, this.#cls, [
      styles.root,
      styles[this.size],
      styles[this.weight],
      styles[this.tone],
      styles[this.font],
      styles[this.align],
      this.truncate && styles.truncate,
      this.inline && styles.inline,
    ]);
  }
}
