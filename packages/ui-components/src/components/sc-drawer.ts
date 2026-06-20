// <sc-drawer-base> — an edge-anchored slide-in panel: a native <dialog> opened
// with showModal() (so it's a blocking, top-layer overlay with a ::backdrop +
// focus trap + Esc, exactly like sc-modal-base — see ScDialogBase), but pinned
// to a viewport edge instead of centred. NOT floating-ui: there's no trigger to
// anchor to, the edge position is pure CSS.
//
// The dialog carries `.drawer`; `side` (right default | left) reflects to the
// host so the CSS (sc-drawer.css) flips the edge + slide
// direction. The slide in/out is animated natively (@starting-style +
// transition-behavior: allow-discrete), degrading to an instant toggle where
// unsupported. Author content is slotted as light DOM; a direct-child <header>
// becomes the title bar.

import { property } from "lit/decorators.js";
import { ScDialogBase } from "./internal/sc-dialog-base";

export type ScDrawerSide = "right" | "left";

export class ScDrawerBase extends ScDialogBase {
  @property({ reflect: true }) accessor side: ScDrawerSide = "right";

  protected get dialogClass(): string {
    return "drawer";
  }
}
