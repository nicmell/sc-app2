import { css } from "lit";

/** <sc-textarea-base> — multi-line field chrome (shadow): folds in the bare
 *  textarea{} surface fill / border / focus ring / sans font / vertical resize,
 *  plus `.sc-textarea` full-width + sizing. */
export const textareaStyles = css`
  :host {
    display: block;
  }

  .sc-textarea {
    box-sizing: border-box;
    inline-size: 100%;
    padding: var(--space-2xs) var(--space-xs);
    background: var(--color-surface-input);
    color: var(--color-text);
    border: 1px solid var(--color-border-stronger);
    border-radius: var(--radius-xs);
    font: inherit;
    font-family: var(--font-sans);
    resize: vertical;
    transition: border-color var(--transition-fast);
  }
  .sc-textarea:focus {
    outline: none;
    border-color: var(--color-border-focus);
  }
  .sc-textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sc-textarea--sm {
    padding: var(--space-3xs) var(--space-2xs);
    font-size: var(--font-size-xs);
  }
  .sc-textarea--md {
    font-size: var(--font-size-sm);
  }
  .sc-textarea--lg {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-md);
  }
`;
