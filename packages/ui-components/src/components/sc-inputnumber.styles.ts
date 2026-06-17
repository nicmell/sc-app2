import { css } from "lit";

/** <sc-inputnumber-base> — wrapper + themed up/down steppers. Composed AFTER
 *  inputStyles (which gives the `.sc-input` field chrome + number spin hiding). */
export const inputnumberStyles = css`
  .sc-inputnumber {
    position: relative;
    display: inline-block;
  }

  .sc-inputnumber__field {
    padding-right: 1.6rem;
  }

  .sc-inputnumber--sm .sc-inputnumber__field {
    padding: var(--space-3xs) var(--space-2xs);
    padding-right: 1.4rem;
    font-size: var(--font-size-xs);
  }
  .sc-inputnumber--md .sc-inputnumber__field {
    font-size: var(--font-size-sm);
  }
  .sc-inputnumber--lg .sc-inputnumber__field {
    padding: var(--space-xs) var(--space-sm);
    padding-right: 1.9rem;
    font-size: var(--font-size-md);
  }

  .sc-inputnumber__spinners {
    position: absolute;
    top: 1px;
    right: 1px;
    bottom: 1px;
    display: flex;
    flex-direction: column;
    width: 1.25rem;
    border-left: 1px solid var(--color-border-stronger);
  }

  .sc-inputnumber__step {
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
  .sc-inputnumber__step--up {
    border-bottom: 1px solid var(--color-border-stronger);
    border-top-right-radius: var(--radius-xs);
  }
  .sc-inputnumber__step--down {
    border-bottom-right-radius: var(--radius-xs);
  }
  .sc-inputnumber__step:hover:not(:disabled) {
    color: var(--color-text);
  }
  .sc-inputnumber__step:disabled {
    cursor: not-allowed;
  }

  .sc-inputnumber__arrow {
    width: 0;
    height: 0;
    border-left: 0.25rem solid transparent;
    border-right: 0.25rem solid transparent;
  }
  .sc-inputnumber__arrow--up {
    border-bottom: 0.3rem solid currentColor;
  }
  .sc-inputnumber__arrow--down {
    border-top: 0.3rem solid currentColor;
  }

  .sc-inputnumber--disabled {
    opacity: 0.5;
  }
`;
