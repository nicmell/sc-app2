// <sc-stack-base> styles. Vertical flex layout; xs is the base gap.

import { css } from "lit";

export const styles = css`
  :host {
    display: block;
  }

  .root {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
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
