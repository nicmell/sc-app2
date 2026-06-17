import { css } from "lit";

/** <sc-disclosure-base> — collapsible card over a native <details>. Folds in the
 *  base details>summary styling (cursor / dim→text colour) that used to come
 *  from the global base sheet, then adds the card chrome + rotating chevron. */
export const disclosureStyles = css`
  :host {
    display: block;
  }

  .sc-disclosure {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    overflow: hidden;
  }

  .sc-disclosure__summary {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    list-style: none;
    cursor: pointer;
    user-select: none;
    color: var(--color-text-dim);
    font-size: var(--font-size-sm);
    transition: color var(--transition-fast);
  }
  .sc-disclosure__summary::-webkit-details-marker {
    display: none;
  }
  .sc-disclosure__summary:hover,
  .sc-disclosure[open] .sc-disclosure__summary {
    color: var(--color-text);
  }

  /* Chevron: right (▶) closed, down (▼) open; follows currentColor. */
  .sc-disclosure__summary::after {
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
  .sc-disclosure[open] .sc-disclosure__summary::after {
    rotate: 45deg;
  }

  .sc-disclosure__content {
    padding: var(--space-sm);
    border-top: 1px solid var(--color-border);
    color: var(--color-text);
    font-size: var(--font-size-sm);
  }
`;
