// <sc-empty-base> styles. Dashed placeholder, muted text, centred. Content slotted.

import { css } from "lit";

export const styles = css`
  :host {
    display: block;
  }

  .root {
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
