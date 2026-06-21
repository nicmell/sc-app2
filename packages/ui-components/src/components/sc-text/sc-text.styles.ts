// <sc-text-base> typography styles. Shadow DOM: `:host { display: contents }`
// so the inner `.root` element is the effective text box (block or inline),
// carrying the size/weight/tone/font/align/truncate modifier classes. Defaults
// (md / regular / sans / default tone / start) are the base `.root` rule.

import { css } from "lit";

export const styles = css`
  :host {
    display: contents;
  }

  .root {
    display: block;
    margin: 0;
    font-family: var(--font-sans);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-regular);
    line-height: var(--line-height-normal);
    color: var(--color-text);
  }

  .root.inline {
    display: inline;
  }

  /* Size */
  .root.xs {
    font-size: var(--font-size-xs);
  }
  .root.sm {
    font-size: var(--font-size-sm);
  }
  .root.lg {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-tight);
  }
  .root.xl {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
  }

  /* Weight */
  .root.medium {
    font-weight: var(--font-weight-medium);
  }
  .root.bold {
    font-weight: var(--font-weight-bold);
  }

  /* Font family */
  .root.mono {
    font-family: var(--font-mono);
  }

  /* Tone (colour) */
  .root.dim {
    color: var(--color-text-dim);
  }
  .root.mute {
    color: var(--color-text-mute);
  }
  .root.faint {
    color: var(--color-text-faint);
  }
  .root.primary {
    color: var(--color-primary);
  }
  .root.ok {
    color: var(--color-ok-text);
  }
  .root.warn {
    color: var(--color-warn-text);
  }
  .root.error {
    color: var(--color-error-text);
  }
  .root.info {
    color: var(--color-info-text);
  }

  /* Alignment */
  .root.center {
    text-align: center;
  }
  .root.end {
    text-align: end;
  }

  /* Truncation (single line) */
  .root.truncate {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`;
