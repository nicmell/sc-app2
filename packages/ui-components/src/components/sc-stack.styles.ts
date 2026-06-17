import { css } from "lit";

/** <sc-stack-base> — vertical flex; monotonic `gap` scale → `:host([gap=…])`. */
export const stackStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  :host([gap="sm"]) {
    gap: var(--space-sm);
  }
  :host([gap="md"]) {
    gap: var(--space-md);
  }
  :host([gap="lg"]) {
    gap: var(--space-lg);
  }
`;
