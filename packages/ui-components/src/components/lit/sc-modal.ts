// <sc-modal-base> — a centred, blocking modal built on the native <dialog>.
// Modals aren't anchored (so no PopoverController/floating-ui); a dialog opened
// with showModal() gives the **top layer**, a ::backdrop, a focus trap, and Esc
// dismissal for free — the same top layer the popovers use, so a modal and the
// toast stack compose by stacking order rather than fragile z-index.
//
// Shadow DOM + the adopted foundation sheet: the dialog carries `.modal` (chrome
// from foundations/components/modal.css) and the author's content is slotted in
// as light DOM (styled by the document's global foundation classes —
// .modal-title/.modal-body/.modal-actions).
//
// Controlled by `open` (→ showModal/close). `dismissable` gates Esc + backdrop
// click; a non-dismissable modal (e.g. a connection-error notice) ignores both.
// Emits a bubbling `close` on every dismissal so React can unmount.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { foundationStyles } from "./internal/foundation-styles";

export class ScModalBase extends LitElement {
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** Whether Esc / backdrop-click close the modal. Off = blocking. */
  @property({ type: Boolean }) accessor dismissable = false;

  static styles = foundationStyles ? [foundationStyles] : [];

  get #dialog(): HTMLDialogElement | null {
    return this.renderRoot.querySelector("dialog");
  }

  // Esc fires `cancel` first — swallow it when blocking so the dialog stays up.
  // (For a real user Esc this `cancel` is cancelable; the UA may make it
  // non-cancelable for low-activation/repeat closes, which #onClose then catches.)
  #onCancel = (e: Event): void => {
    if (!this.dismissable) e.preventDefault();
  };

  // Backdrop click: a modal dialog reports clicks on its ::backdrop as targeting
  // the dialog itself (content sits in the slot, so a child click won't match).
  #onClick = (e: MouseEvent): void => {
    if (this.dismissable && e.target === this.#dialog) this.#dialog?.close();
  };

  // Fires for Esc / backdrop / programmatic close. A blocking modal (not
  // dismissable) that still got here — an Esc the UA wouldn't let us cancel —
  // re-asserts itself rather than vanishing; otherwise it's the single dismissal
  // signal back to the host.
  #onClose = (): void => {
    if (!this.dismissable && this.open) {
      this.#sync(); // re-show: open is still true, dialog just closed
      return;
    }
    if (this.open) this.open = false;
    this.dispatchEvent(new Event("close", { bubbles: true }));
  };

  protected firstUpdated(): void {
    this.#sync();
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("open")) this.#sync();
  }

  #sync(): void {
    const dialog = this.#dialog;
    if (!dialog) return;
    try {
      if (this.open && !dialog.open) dialog.showModal();
      else if (!this.open && dialog.open) dialog.close();
    } catch {
      /* no <dialog>/top-layer support (e.g. happy-dom) */
    }
  }

  render() {
    return html`
      <dialog class="modal" @cancel=${this.#onCancel} @close=${this.#onClose} @click=${this.#onClick}>
        <slot></slot>
      </dialog>
    `;
  }
}
