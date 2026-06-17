import { css } from "lit";

/** <sc-popover-base> — anchored top-layer panel (positioned fixed by the
 *  controller; UA popover centering reset). */
export const popoverStyles = css`
  :host {
    display: inline-block;
  }
  .sc-popover {
    margin: 0;
    inset: auto;
    padding: var(--space-2xs);
    background: var(--color-surface-1);
    color: var(--color-text);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-lg);
    max-block-size: 80vh;
    overflow: auto;
  }
`;
