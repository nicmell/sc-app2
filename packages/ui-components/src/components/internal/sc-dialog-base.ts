// ScDialogBase — the shared machinery for the top-layer blocking overlays
// (sc-modal-base, sc-drawer-base), both built on a native <dialog> opened with
// showModal(): the **top layer** (escapes clipping/transform/z-index), a
// ::backdrop, a focus trap, and Esc — all free, no floating-ui (these aren't
// anchored to a trigger). Subclasses only supply the dialog's class + their CSS;
// the open/close/dismiss lifecycle lives here.
//
// Shadow DOM + the adopted foundation sheet: the dialog carries the chrome class
// and the author's content is slotted in as light DOM. Controlled by `open` (→
// showModal/close); `dismissable` gates Esc + backdrop click (off = blocking).
// Emits a bubbling `close` on every dismissal so a React host can unmount.

import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
export abstract class ScDialogBase extends LitElement {
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** Whether Esc / backdrop-click close it. Off = blocking. */
  @property({ type: Boolean }) accessor dismissable = false;
  /** Accessible name for the dialog (→ aria-label). Without it a screen reader
   *  announces an unnamed dialog; set it to the modal/drawer's title. */
  @property() accessor label = "";

  // Subclasses provide `static styles` (their own chrome + the shared reset).

  /** The chrome class on the <dialog> (keyed by the subclass's styles). */
  protected abstract get dialogClass(): string;

  protected get dialog(): HTMLDialogElement | null {
    return this.renderRoot.querySelector("dialog");
  }

  // Esc fires `cancel` first — swallow it when blocking so the dialog stays up.
  // (For a real user Esc this `cancel` is cancelable; the UA may make it
  // non-cancelable for low-activation/repeat closes, which onClose then catches.)
  protected onCancel = (e: Event): void => {
    if (!this.dismissable) e.preventDefault();
  };

  // Backdrop click: a modal dialog reports clicks on its ::backdrop as targeting
  // the dialog itself (content sits in the slot, so a child click won't match).
  protected onBackdropClick = (e: MouseEvent): void => {
    if (this.dismissable && e.target === this.dialog) this.dialog?.close();
  };

  // Fires for Esc / backdrop / programmatic close. A blocking instance (not
  // dismissable) that still got here — an Esc the UA wouldn't let us cancel —
  // re-asserts itself rather than vanishing; otherwise it's the single dismissal
  // signal back to the host.
  protected onClose = (): void => {
    if (!this.dismissable && this.open) {
      this.sync(); // re-show: open is still true, the dialog just closed
      return;
    }
    if (this.open) this.open = false;
    this.dispatchEvent(new Event("close", { bubbles: true }));
  };

  protected firstUpdated(): void {
    this.sync();
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("open")) this.sync();
  }

  protected sync(): void {
    const dialog = this.dialog;
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
      <dialog
        class=${this.dialogClass}
        aria-label=${this.label || nothing}
        @cancel=${this.onCancel}
        @close=${this.onClose}
        @click=${this.onBackdropClick}
      >
        <slot></slot>
      </dialog>
    `;
  }
}
