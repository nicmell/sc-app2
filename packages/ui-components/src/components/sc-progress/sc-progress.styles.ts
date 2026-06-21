// <sc-progress-base> styles. `bar` (track + fill) and `spinner` (ring) shapes,
// each in `indeterminate` (animated) or `determinate` (fixed) mode. Sizes
// sm/md/lg. Accent = --color-primary; track = --color-surface-3.

import { css } from "lit";

export const styles = css`
  :host {
    display: block;
  }

  /* ── Bar ── */
  .bar {
    position: relative;
    width: 100%;
    height: var(--_bar-h, 4px);
    background: var(--color-surface-3);
    border-radius: var(--radius-xs);
    overflow: hidden;
  }
  .bar.sm {
    --_bar-h: 3px;
  }
  .bar.md {
    --_bar-h: 4px;
  }
  .bar.lg {
    --_bar-h: 8px;
  }

  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    height: 100%;
    width: 0;
    background: var(--color-primary);
    border-radius: inherit;
    transition: width var(--transition-base);
  }

  .bar.indeterminate .fill {
    width: 40%;
    background: linear-gradient(90deg, transparent 0%, var(--color-primary) 50%, transparent 100%);
    animation: sc-progress-slide 1.4s ease-in-out infinite;
    transition: none;
  }

  @keyframes sc-progress-slide {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(350%);
    }
  }

  /* ── Spinner ── */
  .spinner {
    display: inline-block;
    width: var(--_spin, 1.5rem);
    height: var(--_spin, 1.5rem);
    border-radius: 50%;
    vertical-align: middle;
  }
  .spinner.sm {
    --_spin: 1rem;
    --_thick: 2px;
  }
  .spinner.md {
    --_spin: 1.5rem;
    --_thick: 3px;
  }
  .spinner.lg {
    --_spin: 2.5rem;
    --_thick: 4px;
  }

  .spinner.indeterminate {
    border: var(--_thick, 3px) solid var(--color-surface-3);
    border-top-color: var(--color-primary);
    animation: sc-progress-spin 0.8s linear infinite;
  }

  .spinner.determinate {
    background: conic-gradient(
      var(--color-primary) calc(var(--_pct, 0) * 1%),
      var(--color-surface-3) 0
    );
    -webkit-mask: radial-gradient(
      farthest-side,
      transparent calc(100% - var(--_thick, 3px)),
      #000 calc(100% - var(--_thick, 3px))
    );
    mask: radial-gradient(
      farthest-side,
      transparent calc(100% - var(--_thick, 3px)),
      #000 calc(100% - var(--_thick, 3px))
    );
    transition: background var(--transition-base);
  }

  @keyframes sc-progress-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bar.indeterminate .fill,
    .spinner.indeterminate {
      animation-duration: 3s;
    }
  }
`;
