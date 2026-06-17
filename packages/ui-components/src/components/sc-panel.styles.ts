import { css } from "lit";

/** <sc-panel-base> — surface card; a slotted direct-child <header> is the title
 *  bar (styled via ::slotted); `disabled` mutes it. */
export const panelStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-md);
    background: var(--color-surface-1);
    color: var(--color-text);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
  }
  ::slotted(header) {
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.7;
    color: var(--color-text-dim);
  }
  :host([disabled]) {
    opacity: 0.55;
    pointer-events: none;
    user-select: none;
  }
`;
