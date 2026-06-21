// <sc-alert-base> styles. Inline notice card; info is the base, variant classes
// recolour. Content is slotted.

import { css } from "lit";

export const styles = css`
  :host {
    display: block;
  }

  .root {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--color-info-border);
    border-radius: var(--radius-sm);
    background: var(--color-info-bg);
    color: var(--color-info-text);
    font-size: var(--font-size-sm);
  }

  .root.error {
    background: var(--color-error-bg);
    border-color: var(--color-error-border);
    color: var(--color-error-text);
  }
  .root.warn {
    background: var(--color-warn-bg);
    border-color: var(--color-warn-border);
    color: var(--color-warn-text);
  }
  .root.success {
    background: var(--color-ok-bg);
    border-color: var(--color-ok-strong);
    color: var(--color-ok-text);
  }
`;
