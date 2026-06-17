import { css } from "lit";

/** <sc-badge-base> — uppercase pill. Inner `.badge` span; `variant` → modifier. */
export const badgeStyles = css`
  :host {
    display: inline-flex;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: var(--space-2xs) var(--space-xs);
    background: var(--color-ok-bg);
    border: 1px solid var(--color-ok-strong);
    border-radius: var(--radius-pill);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-ok-text);
  }
  .badge--warn {
    background: var(--color-warn-bg);
    border-color: var(--color-warn-border);
    color: var(--color-warn-text);
  }
  .badge--error {
    background: var(--color-error-bg);
    border-color: var(--color-error-border);
    color: var(--color-error-text);
  }
`;
