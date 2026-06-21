// <sc-icon-base> styles. Sizing/colour for the Phosphor glyph; the glyph itself
// (font-family + ::before codepoint) comes from the Phosphor font CSS adopted
// into the shadow by internal/icon-font.ts.

import { css } from "lit";

export const styles = css`
  :host {
    display: inline-flex;
  }

  .root {
    font-size: inherit;
    line-height: 1;
    color: inherit;
  }

  .root.sm {
    font-size: var(--font-size-xs);
  }
  .root.md {
    font-size: var(--font-size-sm);
  }
  .root.lg {
    font-size: var(--font-size-lg);
  }
`;
