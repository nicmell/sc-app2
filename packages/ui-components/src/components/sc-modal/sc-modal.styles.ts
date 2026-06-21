// <sc-modal-base> dialog chrome. The `.root` <dialog> is a centred flex column
// that gap-stacks its slotted content; the UA centres it in the top layer.

import { css } from "lit";

export const styles = css`
  .root {
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

  .root::backdrop {
    background: var(--color-scrim);
  }

  /* display:flex overrides the UA dialog:not([open]) hide — re-hide the
     mounted-but-closed dialog until showModal() sets [open]. */
  .root:not([open]) {
    display: none;
  }
`;
