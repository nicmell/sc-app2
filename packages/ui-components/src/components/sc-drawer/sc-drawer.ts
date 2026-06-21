// <sc-drawer-base> — an edge-anchored slide-in panel: a native <dialog> opened
// with showModal() (so it's a blocking, top-layer overlay with a ::backdrop +
// focus trap + Esc, exactly like sc-modal-base — see ScDialogBase), but pinned
// to a viewport edge instead of centred. NOT floating-ui: there's no trigger to
// anchor to, the edge position is pure CSS.
//
// The dialog carries the scoped `styles.root` chrome (sc-drawer.module.css,
// adopted into the shadow) + a `left` modifier class when `side="left"` (the
// CSS flips the edge + slide direction). The slide in/out is animated natively
// (@starting-style + transition-behavior: allow-discrete), degrading to an
// instant toggle where unsupported. Author content is slotted as light DOM; the
// component tags the direct-child <header> with a scoped class, and the
// scrolling body uses the consumer-written global `.sc-drawer__body` — both
// styles ride the module's default-import injection into the document.

import { property } from "lit/decorators.js";
import { unsafeCSS } from "lit";
import cx from "classnames";
import { ScDialogBase } from "../internal/sc-dialog-base";
import { foundationStyles } from "../internal/foundation-styles";
import styles from "./sc-drawer.module.css";
import sheet from "./sc-drawer.module.css?inline";

export type ScDrawerSide = "right" | "left";

export class ScDrawerBase extends ScDialogBase {
  @property({ reflect: true }) accessor side: ScDrawerSide = "right";

  static styles = [...(foundationStyles ? [foundationStyles] : []), unsafeCSS(sheet ?? "")];

  protected get dialogClass(): string {
    return cx(styles.root, { [styles.left]: this.side === "left" });
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    super.updated(changed);
    // Tag the slotted (author) <header> with the scoped class — it's light DOM,
    // so we class it rather than style by tag.
    this.querySelector(":scope > header")?.classList.add(styles.header);
  }
}
