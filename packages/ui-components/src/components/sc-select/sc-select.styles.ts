// <sc-select-base> chrome. The combobox button + the top-layer popover dropdown.
// Size is a class on the combobox; the accent is carried per-option (the options
// self-apply the variant from the select context, in their own shadow).

import { css } from "lit";

export const styles = css`
  :host {
    display: inline-block;
    font-family: var(--font-mono);
  }

  .combobox {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    inline-size: 100%;
    min-inline-size: 6rem;
    margin: 0;
    padding: var(--space-2xs) var(--space-xs);
    background: var(--color-surface-input);
    color: var(--color-text);
    border: 1px solid var(--color-border-stronger);
    border-radius: var(--radius-sm);
    font: inherit;
    font-size: var(--font-size-sm);
    cursor: pointer;
    user-select: none;
    transition: border-color var(--transition-fast);

    &.sm {
      font-size: var(--font-size-xs);
    }
    &.lg {
      font-size: var(--font-size-md);
    }
    &:hover,
    &:focus-visible {
      outline: none;
      border-color: var(--color-border-focus);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .label {
    flex: 1 1 auto;
    text-align: left;
  }

  .arrow {
    inline-size: 0;
    block-size: 0;
    border-left: 0.3rem solid transparent;
    border-right: 0.3rem solid transparent;
    border-top: 0.35rem solid var(--color-text-dim);
  }

  /* Top-layer popover dropdown (positioned fixed by the controller). */
  .dropdown {
    margin: 0;
    inset: auto;
    min-inline-size: 8rem;
    padding: var(--space-3xs);
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-lg);
    max-block-size: 14rem;
    overflow-y: auto;
  }
`;
