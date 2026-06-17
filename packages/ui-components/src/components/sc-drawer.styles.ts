import { css } from "lit";

/** <sc-drawer-base> dialog chrome (shadow): edge-pinned, slides via translate +
 *  @starting-style + allow-discrete. The slotted title bar (header / header h2)
 *  + .drawer-body stay global (app-provided light-DOM content). */
export const drawerStyles = css`
  :host {
    display: contents;
  }

  .drawer {
    display: flex;
    flex-direction: column;
    position: fixed;
    margin: 0;
    inset: 0 0 0 auto; /* pinned to the right edge */
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

  dialog.drawer:not([open]) {
    display: none;
  }

  .drawer[open] {
    translate: 0 0;
  }

  @starting-style {
    .drawer[open] {
      translate: 100% 0;
    }
  }

  :host([side="left"]) .drawer {
    inset: 0 auto 0 0;
    border-inline-start: none;
    border-inline-end: 1px solid var(--color-border-strong);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    translate: -100% 0;
  }
  :host([side="left"]) .drawer[open] {
    translate: 0 0;
  }
  @starting-style {
    :host([side="left"]) .drawer[open] {
      translate: -100% 0;
    }
  }

  .drawer::backdrop {
    background: var(--color-scrim);
    opacity: 0;
    transition:
      opacity var(--transition-base),
      overlay var(--transition-base) allow-discrete,
      display var(--transition-base) allow-discrete;
  }
  .drawer[open]::backdrop {
    opacity: 1;
  }
  @starting-style {
    .drawer[open]::backdrop {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .drawer,
    .drawer::backdrop {
      transition: none;
    }
  }
`;
