// <sc-modal-base> — a centred, blocking modal built on the native <dialog>
// (showModal() → top layer, ::backdrop, focus trap, Esc — see ScDialogBase).
// Shadow DOM: the <dialog> carries the `.root` chrome and gap-stacks the author's
// slotted content (the consumer styles their own title/body/actions).

import { ScDialogBase } from "../internal/sc-dialog-base";
import { foundations } from "../internal/foundation-styles";
import { styles } from "./sc-modal.styles";

export class ScModalBase extends ScDialogBase {
  static styles = [foundations, styles];

  protected get dialogClass(): string {
    return "root";
  }
}
