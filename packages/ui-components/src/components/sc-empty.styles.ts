import { css } from "lit";

/** <sc-empty-base> — dashed "nothing here" placeholder. */
export const emptyStyles = css`
  :host {
    display: block;
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-surface-2);
    border: 1px dashed var(--color-border-strong);
    border-radius: var(--radius-sm);
    color: var(--color-text-mute);
    font-size: var(--font-size-xs);
    text-align: center;
  }
`;
