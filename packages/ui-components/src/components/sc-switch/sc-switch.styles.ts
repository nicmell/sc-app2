// <sc-switch-base> styles. Pill track with a sliding thumb; track-on = `--_accent`.

import { css } from "lit";

export const styles = css`
  :host {
    display: inline-block;
  }

  .root {
    display: inline-flex;
    align-items: center;
    cursor: pointer;

    &.sm {
      --_w: 1.75rem;
      --_h: 1rem;
    }
    &.md {
      --_w: 2.25rem;
      --_h: 1.25rem;
    }
    &.lg {
      --_w: 3rem;
      --_h: 1.6rem;
    }
  }

  .track {
    position: relative;
    display: inline-block;
    inline-size: var(--_w, 2.25rem);
    block-size: var(--_h, 1.25rem);
    background: var(--color-surface-3);
    border-radius: var(--radius-pill);
    transition: background var(--transition-base);
  }

  .thumb {
    position: absolute;
    top: 50%;
    left: 0.15rem;
    transform: translateY(-50%);
    inline-size: calc(var(--_h) - 0.3rem);
    block-size: calc(var(--_h) - 0.3rem);
    background: var(--color-on-primary);
    border-radius: 50%;
    transition: left var(--transition-base);
  }

  .input {
    &:checked ~ .track {
      background: var(--_accent);
      .thumb {
        left: calc(100% - (var(--_h) - 0.3rem) - 0.15rem);
      }
    }
    &:focus-visible ~ .track {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 2px;
    }
  }
`;
