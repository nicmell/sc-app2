import { css } from "lit";

/** <sc-modal-base> dialog chrome (shadow). The slotted content classes
 *  (.modal-title/.modal-body/.modal-actions) + the app's .modal-backdrop/
 *  .modal-progress stay global (the app provides that light-DOM content). */
export const modalStyles = css`
  .modal {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-width: 320px;
    max-width: 480px;
    max-block-size: calc(100vh - 2 * var(--space-lg));
    padding: var(--space-md) var(--space-lg);
    background: var(--color-surface-1);
    color: var(--color-text);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    box-shadow: var(--shadow-lg);
    overflow: auto;
  }

  /* Dim the page behind the modal dialog (shared scrim, no blur). */
  .modal::backdrop {
    background: var(--color-scrim);
  }

  /* The .modal display:flex overrides the UA dialog:not([open]) hide — re-hide
     the closed dialog until showModal() sets [open]. */
  dialog.modal:not([open]) {
    display: none;
  }
`;
