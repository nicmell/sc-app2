import { css } from "lit";

/** <sc-radio-group-base> — lays out its slotted <sc-radio-base> children; styled
 *  off the reflected `orientation`/`disabled` attributes. */
export const radioGroupStyles = css`
  :host {
    display: inline-flex;
    gap: var(--space-xs);
    align-items: center;
  }
  :host([orientation="vertical"]) {
    flex-direction: column;
    align-items: flex-start;
  }
  :host([disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
