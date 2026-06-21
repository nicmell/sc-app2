// <sc-checkbox-base> styles. Box + optional label; accent = `--_accent` (set by
// the variant class on `.root`). Sizes scale the box via `--_box`.

import { css } from "lit";

export const styles = css`
  :host {
    display: inline-block;
  }

  .root {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    cursor: pointer;
    user-select: none;
    font-family: var(--font-mono);
    color: var(--color-text-dim);
  }

  .box {
    display: inline-grid;
    place-items: center;
    inline-size: var(--_box, 1rem);
    block-size: var(--_box, 1rem);
    background: var(--color-surface-input);
    border: 1px solid var(--color-border-stronger);
    border-radius: var(--radius-sm);
    transition:
      border-color var(--transition-fast),
      background var(--transition-fast);
  }

  .root.sm {
    --_box: 0.875rem;
    font-size: var(--font-size-xs);
  }
  .root.md {
    --_box: 1rem;
    font-size: var(--font-size-sm);
  }
  .root.lg {
    --_box: 1.25rem;
    font-size: var(--font-size-md);
  }

  .check {
    inline-size: 60%;
    block-size: 60%;
    border-radius: var(--radius-xs);
    background: var(--_accent);
    transform: scale(0);
    transition: transform var(--transition-fast);
  }

  .input:checked ~ .box {
    border-color: var(--_accent);
  }
  .input:checked ~ .box .check {
    transform: scale(1);
  }

  .input:focus-visible ~ .box {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }
`;
