import { css } from "lit";

export const optionStyles = css`
  :host {
    display: block;
  }
  .sc-option {
    display: block;
    padding: var(--space-2xs) var(--space-xs);
    cursor: pointer;
    user-select: none;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    border-radius: var(--radius-xs);
  }
  .sc-option--sm {
    font-size: var(--font-size-xs);
  }
  .sc-option--lg {
    font-size: var(--font-size-md);
  }
  .sc-option--selected {
    color: var(--_accent);
    font-weight: var(--font-weight-medium);
  }
`;
