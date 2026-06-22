// <sc-toast-base> styles. A single notification card with a per-variant left
// accent. The fixed-position stack container is the consumer's concern (not part
// of this component).

import { css } from "lit";

export const styles = css`
  :host {
    display: block;
  }

  .root {
    display: flex;
    align-items: flex-start;
    gap: var(--space-xs);
    min-width: 16rem;
    max-width: 24rem;
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-surface-1);
    color: var(--color-text);
    border: 1px solid var(--color-border-strong);
    border-left: 3px solid var(--color-text-mute);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    font-size: var(--font-size-sm);
    pointer-events: auto;
    animation: sc-toast-slide-in var(--transition-base);
  }

  .root.success {
    border-left-color: var(--color-ok);
  }
  .root.warn {
    border-left-color: var(--color-warn);
  }
  .root.error {
    border-left-color: var(--color-danger);
  }
  .root.info {
    border-left-color: var(--color-primary);
  }

  .message {
    flex: 1 1 auto;
    word-wrap: break-word;
    overflow-wrap: anywhere;
    line-height: var(--line-height-normal);
  }

  .close {
    flex: 0 0 auto;
    padding: 0;
    width: 1.25rem;
    height: 1.25rem;
    background: transparent;
    border: none;
    color: var(--color-text-mute);
    cursor: pointer;
    font-size: var(--font-size-md);
    line-height: 1;
    border-radius: var(--radius-xs);
  }
  .close:hover:not(:disabled) {
    color: var(--color-text);
    background: var(--color-surface-3);
  }

  @keyframes sc-toast-slide-in {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .root {
      animation: none;
    }
  }
`;
