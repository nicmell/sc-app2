import { css } from "lit";

/** <sc-cluster-base> — horizontal flex (wraps); monotonic `gap` scale. */
export const clusterStyles = css`
  :host {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
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
