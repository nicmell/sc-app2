import { css } from "lit";

/** <sc-toast-base> — a single notification card (the `.toast-stack` container
 *  stays in the app/global CSS; a toast just lives inside it). */
export const toastStyles = css`
  :host {
    display: block;
  }

  .toast {
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
    animation: toast-slide-in var(--transition-base);
  }

  .toast--success {
    border-left-color: var(--color-ok);
  }
  .toast--warn {
    border-left-color: var(--color-warn);
  }
  .toast--error {
    border-left-color: var(--color-danger);
  }
  .toast--info {
    border-left-color: var(--color-primary);
  }

  .toast-message {
    flex: 1 1 auto;
    word-wrap: break-word;
    overflow-wrap: anywhere;
    line-height: var(--line-height-normal);
  }

  .toast-close {
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
  .toast-close:hover:not(:disabled) {
    color: var(--color-text);
    background: var(--color-surface-3);
  }

  @keyframes toast-slide-in {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
