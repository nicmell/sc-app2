// <sc-modal-base> — a centred, blocking modal built on the native <dialog>
// (showModal() → top layer, ::backdrop, focus trap, Esc — see ScDialogBase).
// The dialog carries `.modal` (chrome from sc-modal.css) and
// the author's content is slotted in as light DOM (styled by the global
// foundation classes — .modal-title/.modal-body/.modal-actions).

import { ScDialogBase } from "./internal/sc-dialog-base";

export class ScModalBase extends ScDialogBase {
  protected get dialogClass(): string {
    return "modal";
  }
}
