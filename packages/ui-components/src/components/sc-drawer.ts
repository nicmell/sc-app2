// <sc-drawer-base> — an edge-anchored slide-in panel: a native <dialog> opened
// with showModal() (so it's a blocking, top-layer overlay with a ::backdrop +
// focus trap + Esc, exactly like sc-modal-base — see ScDialogBase), but pinned
// to a viewport edge instead of centred. NOT floating-ui: there's no trigger to
// anchor to, the edge position is pure CSS.
//
// The dialog carries `.drawer`; `side` (right default | left) reflects to the
// host so its styles (sc-drawer.styles.ts) flip the edge + slide direction. The
// slide in/out is animated natively (@starting-style + transition-behavior:
// allow-discrete), degrading to an instant toggle where unsupported. Author
// content is slotted as light DOM; a direct-child <header> (styled by the global
// `sc-drawer-base > header` / `.drawer-body` classes) is the title bar + body.

import { property } from "lit/decorators.js";
import { ScDialogBase } from "./internal/sc-dialog-base";
import { resetStyles } from "./internal/reset.styles";
import { drawerStyles } from "./sc-drawer.styles";

export type ScDrawerSide = "right" | "left";

export class ScDrawerBase extends ScDialogBase {
  @property({ reflect: true }) accessor side: ScDrawerSide = "right";

  static styles = [resetStyles, drawerStyles];

  protected get dialogClass(): string {
    return "drawer";
  }
}
