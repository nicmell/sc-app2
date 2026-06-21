// <sc-drawer-base> dialog chrome. The `.root` <dialog> is pinned to a viewport
// edge (right by default; `.left` flips it) and animated natively (@starting-
// style + allow-discrete). A slotted direct-child <header> is the title bar
// (::slotted).

import { css } from "lit";

export const styles = css`
  :host {
    display: contents;
  }

  .root {
    display: flex;
    flex-direction: column;
    position: fixed;
    margin: 0;
    inset: 0 0 0 auto;
    block-size: 100dvh;
    max-block-size: 100dvh;
    inline-size: min(360px, 90vw);
    padding: 0;
    background: var(--color-surface-1);
    color: var(--color-text);
    border: none;
    border-inline-start: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md) 0 0 var(--radius-md);
    box-shadow: var(--shadow-lg);
    font-family: var(--font-sans);
    overflow: hidden;
    translate: 100% 0;
    transition:
      translate var(--transition-base),
      overlay var(--transition-base) allow-discrete,
      display var(--transition-base) allow-discrete;
  }

  .root:not([open]) {
    display: none;
  }

  .root[open] {
    translate: 0 0;
  }

  @starting-style {
    .root[open] {
      translate: 100% 0;
    }
  }

  /* Left side: pin to the left edge, flip the border, slide from the left. */
  .left {
    inset: 0 auto 0 0;
    border-inline-start: none;
    border-inline-end: 1px solid var(--color-border-strong);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    translate: -100% 0;
  }
  .left[open] {
    translate: 0 0;
  }
  @starting-style {
    .left[open] {
      translate: -100% 0;
    }
  }

  .root::backdrop {
    background: var(--color-scrim);
    opacity: 0;
    transition:
      opacity var(--transition-base),
      overlay var(--transition-base) allow-discrete,
      display var(--transition-base) allow-discrete;
  }
  .root[open]::backdrop {
    opacity: 1;
  }
  @starting-style {
    .root[open]::backdrop {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .root,
    .root::backdrop {
      transition: none;
    }
  }

  /* Slotted direct-child <header> = the title bar. */
  ::slotted(header) {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--color-border);
  }
`;
