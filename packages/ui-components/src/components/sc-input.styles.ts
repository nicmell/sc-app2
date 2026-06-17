import { css } from "lit";

/** <sc-input-base> field chrome (shadow): folds in the bare input{} surface
 *  fill / border / focus ring / mono font the field used to inherit from the
 *  global base sheet, plus `.sc-input` sizing. Reused by <sc-inputnumber-base>. */
export const inputStyles = css`
  :host {
    display: inline-block;
  }

  .sc-input {
    box-sizing: border-box;
    padding: var(--space-2xs) var(--space-xs);
    background: var(--color-surface-input);
    color: var(--color-text);
    border: 1px solid var(--color-border-stronger);
    border-radius: var(--radius-xs);
    font: inherit;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    transition: border-color var(--transition-fast);
  }
  .sc-input:focus {
    outline: none;
    border-color: var(--color-border-focus);
  }
  .sc-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sc-input--sm {
    padding: var(--space-3xs) var(--space-2xs);
    font-size: var(--font-size-xs);
  }
  .sc-input--md {
    font-size: var(--font-size-sm);
  }
  .sc-input--lg {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-md);
  }

  /* Hide the native number spin buttons (themed steppers replace them). */
  .sc-input::-webkit-inner-spin-button,
  .sc-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .sc-input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
`;
