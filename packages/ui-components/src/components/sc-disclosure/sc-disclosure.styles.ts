// <sc-disclosure-base> styles. Card chrome around a native <details>; the base
// details/summary rules come from the adopted foundations, so this adds only the
// card + chevron (a caret <sc-icon-base> that rotates to point down when open).

import { css } from "lit";

export const styles = css`
  :host {
    display: block;
  }

  .root {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    overflow: hidden;

    &[open] .chevron {
      rotate: 90deg;
    }
  }

  .summary {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }
  }

  /* Caret points right (▶) closed, rotates to down (▼) when [open]. */
  .chevron {
    margin-inline-start: auto;
    font-size: 0.85em;
    color: var(--color-text-dim);
    transition: rotate var(--transition-fast);
  }

  .content {
    padding: var(--space-sm);
    border-top: 1px solid var(--color-border);
    color: var(--color-text);
    font-size: var(--font-size-sm);
  }
`;
