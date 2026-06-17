// <sc-modal-base> — a centred, blocking modal built on the native <dialog>
// (showModal() → top layer, ::backdrop, focus trap, Esc — see ScDialogBase).
// Owns the `.modal` dialog chrome via Lit `css` (sc-modal.styles.ts); the
// author's content is slotted in as light DOM, styled by the global
// .modal-title/.modal-body/.modal-actions classes the app provides.

import { ScDialogBase } from "./internal/sc-dialog-base";
import { resetStyles } from "./internal/reset.styles";
import { modalStyles } from "./sc-modal.styles";

export class ScModalBase extends ScDialogBase {
  static styles = [resetStyles, modalStyles];

  protected get dialogClass(): string {
    return "modal";
  }
}
