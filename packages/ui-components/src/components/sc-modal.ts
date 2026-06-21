// <sc-modal-base> — a centred, blocking modal built on the native <dialog>
// (showModal() → top layer, ::backdrop, focus trap, Esc — see ScDialogBase).
// The dialog carries the scoped `styles.root` chrome (sc-modal.module.css,
// adopted into the shadow); the author's content is slotted in as light DOM,
// styled by the GLOBAL classes .sc-modal__title/__body/__actions
// (foundations/components/sc-modal.css).

import { unsafeCSS } from "lit";
import { ScDialogBase } from "./internal/sc-dialog-base";
import { foundationStyles } from "./internal/foundation-styles";
import styles from "./sc-modal.module.css";
import sheet from "./sc-modal.module.css?inline";

export class ScModalBase extends ScDialogBase {
  static styles = [...(foundationStyles ? [foundationStyles] : []), unsafeCSS(sheet ?? "")];

  protected get dialogClass(): string {
    return styles.root;
  }
}
