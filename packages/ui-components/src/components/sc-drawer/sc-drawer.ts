// <sc-drawer-base> — an edge-anchored slide-in panel: a native <dialog> opened
// with showModal() (a blocking, top-layer overlay with a ::backdrop + focus trap
// + Esc, like sc-modal-base — see ScDialogBase), pinned to a viewport edge. NOT
// floating-ui: the edge position is pure CSS.
//
// Shadow DOM: the <dialog> carries the chrome; the reflected `side` (`:host([side])`)
// pins it to a viewport edge. Author content is slotted; a slotted direct-child <header>
// is the title bar (::slotted in the styles).

import { property } from "lit/decorators.js";
import { ScDialogBase } from "../internal/sc-dialog/sc-dialog";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-drawer.scss";

export type ScDrawerSide = "right" | "left";

export class ScDrawerBase extends ScDialogBase {
  static styles = [foundations, styles];

  @property({ reflect: true }) accessor side: ScDrawerSide = "right";
}
