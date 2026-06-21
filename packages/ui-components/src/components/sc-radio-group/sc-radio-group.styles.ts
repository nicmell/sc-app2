// <sc-radio-group-base> styles. Lays out its slotted <sc-radio-base> children in
// a row (or column when `vertical`). The `.disabled` affordance comes from the
// shared widget styles.

import { css } from "lit";

export const styles = css`
  :host {
    display: inline-block;
  }

  .root {
    display: inline-flex;
    gap: var(--space-xs);
    align-items: center;
  }

  .root.vertical {
    flex-direction: column;
    align-items: flex-start;
  }
`;
