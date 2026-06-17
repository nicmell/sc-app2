import { css } from "lit";

/** <sc-text-base> typography, scoped to the shadow host. Size/weight/font/tone/
 *  align + truncate/inline are reflected attributes → `:host([…])` rules; the
 *  inherited font properties flow to the slotted content. */
export const textStyles = css`
  :host {
    display: block;
    margin: 0;
    font-family: var(--font-sans);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-regular);
    line-height: var(--line-height-normal);
    color: var(--color-text);
  }
  :host([inline]) {
    display: inline;
  }

  /* Size */
  :host([size="xs"]) {
    font-size: var(--font-size-xs);
  }
  :host([size="sm"]) {
    font-size: var(--font-size-sm);
  }
  :host([size="lg"]) {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-tight);
  }
  :host([size="xl"]) {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
  }

  /* Weight */
  :host([weight="medium"]) {
    font-weight: var(--font-weight-medium);
  }
  :host([weight="bold"]) {
    font-weight: var(--font-weight-bold);
  }

  /* Font family */
  :host([font="mono"]) {
    font-family: var(--font-mono);
  }

  /* Tone (colour) */
  :host([tone="dim"]) {
    color: var(--color-text-dim);
  }
  :host([tone="mute"]) {
    color: var(--color-text-mute);
  }
  :host([tone="faint"]) {
    color: var(--color-text-faint);
  }
  :host([tone="primary"]) {
    color: var(--color-primary);
  }
  :host([tone="ok"]) {
    color: var(--color-ok-text);
  }
  :host([tone="warn"]) {
    color: var(--color-warn-text);
  }
  :host([tone="error"]) {
    color: var(--color-error-text);
  }
  :host([tone="info"]) {
    color: var(--color-info-text);
  }

  /* Alignment */
  :host([align="center"]) {
    text-align: center;
  }
  :host([align="end"]) {
    text-align: end;
  }

  /* Truncation (single line) */
  :host([truncate]) {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`;
