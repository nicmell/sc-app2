// <sc-cluster-base> styles. Horizontal flex layout (centred, wraps); xs base gap.

import { css } from "lit";

export const styles = css`
  :host {
    display: block;
  }

  .root {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .root.sm {
    gap: var(--space-sm);
  }
  .root.md {
    gap: var(--space-md);
  }
  .root.lg {
    gap: var(--space-lg);
  }
`;
