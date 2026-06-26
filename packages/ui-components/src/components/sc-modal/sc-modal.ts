// <sc-modal-base> — a centred, blocking modal built on the native <dialog>
// (showModal() → top layer, ::backdrop, focus trap, Esc — see ScDialogBase).
// Shadow DOM: the <dialog> carries the chrome and gap-stacks the author's slotted
// content (the consumer styles their own title/body/actions).

import { ScDialogBase } from "../internal/sc-dialog/sc-dialog";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-modal.scss";

export class ScModalBase extends ScDialogBase {
  static styles = [resetStyles, styles];
}
