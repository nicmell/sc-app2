// <sc-inputnumber-base> styles. The numeric field (`.field`) plus custom up/down
// steppers. The bare input{} base + hidden native spin buttons come from the
// adopted foundations; these themed arrows replace them. Arrows are CSS
// triangles in currentColor, following the text tokens.

import { css } from "lit";

export const styles = css`
  :host {
    display: inline-block;
  }

  .root {
    position: relative;
    display: inline-block;
  }

  .field {
    box-sizing: border-box;
    /* Leave room for the stepper column on the right. */
    padding-right: 1.6rem;
  }

  .root.sm .field {
    padding: var(--space-3xs) var(--space-2xs);
    padding-right: 1.4rem;
    font-size: var(--font-size-xs);
  }
  .root.md .field {
    font-size: var(--font-size-sm);
  }
  .root.lg .field {
    padding: var(--space-xs) var(--space-sm);
    padding-right: 1.9rem;
    font-size: var(--font-size-md);
  }

  .spinners {
    position: absolute;
    top: 1px;
    right: 1px;
    bottom: 1px;
    display: flex;
    flex-direction: column;
    width: 1.25rem;
    border-left: 1px solid var(--color-border-stronger);
  }

  .step {
    flex: 1 1 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    background: var(--color-surface-3);
    border: none;
    border-radius: 0;
    color: var(--color-text-dim);
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .stepUp {
    border-bottom: 1px solid var(--color-border-stronger);
    border-top-right-radius: var(--radius-xs);
  }
  .stepDown {
    border-bottom-right-radius: var(--radius-xs);
  }

  .step:hover:not(:disabled) {
    color: var(--color-text);
  }
  .step:disabled {
    cursor: not-allowed;
  }

  .arrow {
    width: 0;
    height: 0;
    border-left: 0.25rem solid transparent;
    border-right: 0.25rem solid transparent;
  }
  .arrowUp {
    border-bottom: 0.3rem solid currentColor;
  }
  .arrowDown {
    border-top: 0.3rem solid currentColor;
  }

  .root.disabled {
    opacity: 0.5;
  }
`;
