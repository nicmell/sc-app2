// <sc-button-base> styles. Appearance variants + sizes + an icon-only square
// mode. The bare button{} base comes from the adopted foundations; `.root`
// overrides it.

import { css } from "lit";

export const styles = css`
  :host {
    display: inline-block;
  }

  .root {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2xs);
    padding: var(--space-xs) var(--space-md);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    font: inherit;
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-tight);
    cursor: pointer;
    user-select: none;
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast);
  }

  /* Sizes */
  .root.sm {
    padding: var(--space-2xs) var(--space-sm);
    font-size: var(--font-size-xs);
  }
  .root.md {
    padding: var(--space-xs) var(--space-md);
    font-size: var(--font-size-sm);
  }
  .root.lg {
    padding: var(--space-sm) var(--space-lg);
    font-size: var(--font-size-md);
  }

  /* Icon-only: square, equal padding. */
  .root.iconOnly {
    padding: var(--space-xs);
  }
  .root.iconOnly.sm {
    padding: var(--space-2xs);
  }
  .root.iconOnly.lg {
    padding: var(--space-sm);
  }

  /* Variants */
  .root.primary {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  .root.primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
  .root.secondary {
    background: var(--color-surface-2);
    color: var(--color-text);
    border-color: var(--color-border-strong);
  }
  .root.secondary:hover:not(:disabled) {
    border-color: var(--color-border-stronger);
  }
  .root.ghost {
    background: transparent;
    color: var(--color-text);
    border-color: var(--color-border-stronger);
  }
  .root.ghost:hover:not(:disabled) {
    border-color: var(--color-border-focus);
  }
  .root.danger {
    background: var(--color-danger);
    color: var(--color-on-primary);
  }
  .root.danger:hover:not(:disabled) {
    background: var(--color-danger-hover);
  }

  .root:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .root:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }
`;
