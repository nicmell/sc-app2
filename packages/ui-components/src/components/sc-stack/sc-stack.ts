// <sc-stack-base> — vertical flex layout primitive (a "column of stacked
// things"). Light DOM and host-only: it renders NO template (default render()
// returns noChange), so the author's children are preserved untouched; it
// applies its scoped `styles.root` + a `gap` modifier class to the host.

import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import { syncHostClasses } from "../internal/host-classes";
import styles from "./sc-stack.module.css";

/** Spacing step — a clean monotonic scale mapping 1:1 to the space tokens:
 *  xs → --space-xs, sm → --space-sm, md → --space-md, lg → --space-lg
 *  (8 / 12 / 16 / 20px). `xs` is the default (the base, no modifier). */
export type ScGap = "xs" | "sm" | "md" | "lg";

export class ScStackBase extends LitElement {
  @property() accessor gap: ScGap = "xs";

  /** Light DOM + no render() ⇒ the children stay; layout is by host class. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  readonly #cls = new Set<string>();
  protected updated(): void {
    syncHostClasses(this, this.#cls, [styles.root, styles[this.gap]]);
  }
}
