// <sc-drawer-base> — an edge-anchored slide-in panel: a native <dialog> opened
// with showModal() (so it's a blocking, top-layer overlay with a ::backdrop +
// focus trap + Esc, exactly like sc-modal-base — see ScDialogBase), but pinned
// to a viewport edge instead of centred. NOT floating-ui: there's no trigger to
// anchor to, the edge position is pure CSS.
//
// The dialog carries the scoped `styles.root` chrome (sc-drawer.module.css,
// adopted into the shadow); `side` (right default | left) reflects to the host
// so the CSS flips the edge + slide direction. The slide in/out is animated
// natively (@starting-style + transition-behavior: allow-discrete), degrading to
// an instant toggle where unsupported. Author content is slotted as light DOM;
// a direct-child <header> becomes the title bar (styled by the GLOBAL
// foundations/components/sc-drawer.css alongside .sc-drawer__body).

import { property } from "lit/decorators.js";
import { unsafeCSS } from "lit";
import { ScDialogBase } from "./internal/sc-dialog-base";
import { foundationStyles } from "./internal/foundation-styles";
import styles from "./sc-drawer.module.css";
import sheet from "./sc-drawer.module.css?inline";

export type ScDrawerSide = "right" | "left";

export class ScDrawerBase extends ScDialogBase {
  @property({ reflect: true }) accessor side: ScDrawerSide = "right";

  static styles = [...(foundationStyles ? [foundationStyles] : []), unsafeCSS(sheet ?? "")];

  protected get dialogClass(): string {
    return styles.root;
  }
}
