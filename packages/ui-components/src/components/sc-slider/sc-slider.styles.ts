// <sc-slider-base> styles. Track + fill + thumb; fill/thumb position is set
// inline (percent). Size sets length/thickness, variant tints fill+thumb via
// `--_accent` (set by the variant class on `.root`).

import { css } from "lit";

export const styles = css`
  :host {
    display: inline-block;
  }

  .root {
    display: inline-block;
    touch-action: none;
    user-select: none;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    &.sm {
      --_len: 6rem;
      --_thick: 0.3rem;
      --_thumb: 0.8rem;
    }
    &.md {
      --_len: 8rem;
      --_thick: 0.4rem;
      --_thumb: 1rem;
    }
    &.lg {
      --_len: 11rem;
      --_thick: 0.5rem;
      --_thumb: 1.25rem;
    }

    /* Horizontal: track runs left→right, fill grows from the left. */
    &.horizontal {
      .track {
        inline-size: var(--_len, 8rem);
        block-size: var(--_thick, 0.4rem);
      }
      .fill {
        left: 0;
        top: 0;
        bottom: 0;
      }
      .thumb {
        top: 50%;
        transform: translate(-50%, -50%);
      }
    }

    /* Vertical: track runs bottom→top, fill grows from the bottom. */
    &.vertical {
      .track {
        inline-size: var(--_thick, 0.4rem);
        block-size: var(--_len, 8rem);
      }
      .fill {
        left: 0;
        right: 0;
        bottom: 0;
      }
      .thumb {
        left: 50%;
        transform: translate(-50%, 50%);
      }
    }
  }

  .track {
    position: relative;
    background: var(--color-surface-input);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-pill);
  }

  .fill {
    position: absolute;
    background: var(--_accent);
    border-radius: var(--radius-pill);
  }

  .thumb {
    position: absolute;
    inline-size: var(--_thumb, 1rem);
    block-size: var(--_thumb, 1rem);
    background: var(--_accent);
    border-radius: 50%;
    box-shadow: var(--shadow-sm);
  }

  /* Keyboard focus ring on the visible thumb (the real <input> is .sr-only). */
  .input:focus-visible ~ .track .thumb {
    box-shadow:
      var(--shadow-sm),
      0 0 0 2px var(--color-border-focus);
  }
`;
