// <sc-textarea-base> field chrome. The bare textarea{} rule (from the adopted
// foundations) gives the surface fill, border, focus ring, sans font, and
// vertical resize; `.root` makes it fill the host and tunes sizing.

import { css } from "lit";

export const styles = css`
  :host {
    display: block;
  }

  .root {
    box-sizing: border-box;
    inline-size: 100%;
  }

  .root.sm {
    padding: var(--space-3xs) var(--space-2xs);
    font-size: var(--font-size-xs);
  }
  .root.md {
    font-size: var(--font-size-sm);
  }
  .root.lg {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-md);
  }
`;
