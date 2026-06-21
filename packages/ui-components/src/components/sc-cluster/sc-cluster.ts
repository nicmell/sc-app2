// <sc-cluster-base> — horizontal flex layout primitive (a "row of inline
// things": toolbars, label + input, chip + readout). Centred cross-axis, wraps.
// Light DOM and host-only: it renders NO template (default render() returns
// noChange), so the author's children are preserved; it applies its scoped
// `styles.root` + a `gap` modifier class to the host. Reuses ScGap.

import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { ScGap } from "../sc-stack/sc-stack";
import { syncHostClasses } from "../internal/host-classes";
import styles from "./sc-cluster.module.css";

export class ScClusterBase extends LitElement {
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
