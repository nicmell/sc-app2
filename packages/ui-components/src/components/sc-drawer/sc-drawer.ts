// <sc-drawer-base> — an edge-anchored slide-in panel: a native <dialog> opened
// with showModal() (a blocking, top-layer overlay with a ::backdrop + focus trap
// + Esc, like sc-modal-base — see ScDialogBase), pinned to a viewport edge. NOT
// floating-ui: the edge position is pure CSS.
//
// Shadow DOM: the <dialog> carries the `.root` chrome (+ a `left` modifier when
// `side="left"`). Author content is slotted; a slotted direct-child <header> is
// the title bar (::slotted in the styles).

import { property } from "lit/decorators.js";
import cx from "classnames";
import { ScDialogBase } from "../internal/sc-dialog-base";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-drawer.css";

export type ScDrawerSide = "right" | "left";

export class ScDrawerBase extends ScDialogBase {
  static styles = [foundations, styles];

  @property({ reflect: true }) accessor side: ScDrawerSide = "right";

  protected get dialogClass(): string {
    return cx("root", { left: this.side === "left" });
  }
}
