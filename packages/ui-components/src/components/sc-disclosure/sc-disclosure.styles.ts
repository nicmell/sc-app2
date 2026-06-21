// <sc-disclosure-base> styles. Card chrome around a native <details>; the base
// details/summary rules come from the adopted foundations, so this adds only the
// card + chevron.

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
  }

  .summary {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    list-style: none;
  }
  .summary::-webkit-details-marker {
    display: none;
  }

  /* Chevron: a rotated border corner. Right (▶) closed, down (▼) open. */
  .summary::after {
    content: "";
    flex: none;
    inline-size: 0.45em;
    block-size: 0.45em;
    margin-inline-start: auto;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    rotate: -45deg;
    transition: rotate var(--transition-fast);
  }
  .root[open] .summary::after {
    rotate: 45deg;
  }

  .content {
    padding: var(--space-sm);
    border-top: 1px solid var(--color-border);
    color: var(--color-text);
    font-size: var(--font-size-sm);
  }
`;
