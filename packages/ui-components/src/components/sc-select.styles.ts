import { css } from "lit";

/** <sc-select-base> chrome (shadow): combobox button + top-layer dropdown. */
export const selectStyles = css`
  :host {
    display: inline-block;
    font-family: var(--font-mono);
    --_accent: var(--color-primary);
  }
  :host([variant="neutral"]) {
    --_accent: var(--color-text-dim);
  }
  :host([variant="ok"]) {
    --_accent: var(--color-ok);
  }
  :host([variant="warn"]) {
    --_accent: var(--color-warn);
  }
  :host([variant="danger"]) {
    --_accent: var(--color-danger);
  }
  :host([disabled]) {
    opacity: 0.5;
    pointer-events: none;
  }

  .sc-select__combobox {
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
  }
  :host([size="sm"]) .sc-select__combobox {
    font-size: var(--font-size-xs);
  }
  :host([size="lg"]) .sc-select__combobox {
    font-size: var(--font-size-md);
  }
  .sc-select__combobox:hover,
  .sc-select__combobox:focus-visible {
    outline: none;
    border-color: var(--color-border-focus);
  }

  .sc-select__label {
    flex: 1 1 auto;
    text-align: left;
  }

  .sc-select__arrow {
    inline-size: 0;
    block-size: 0;
    border-left: 0.3rem solid transparent;
    border-right: 0.3rem solid transparent;
    border-top: 0.35rem solid var(--color-text-dim);
  }

  /* Top-layer popover dropdown (positioned fixed by the controller). */
  .sc-select__dropdown {
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
