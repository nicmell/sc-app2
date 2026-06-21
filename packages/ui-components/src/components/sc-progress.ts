// <sc-progress-base> — a loading / progress indicator. Two shapes (`variant`):
// "bar" (a horizontal track that fills, the default) and "spinner" (a circular
// ring). Each works in two modes, chosen by whether `value` is set:
//   • indeterminate (value unset) — animated; "we're working, no ETA".
//   • determinate (value 0…max)   — fills to value/max; "we're 60% done".
// Light DOM (like the other display components) so the scoped CSS module
// (sc-progress.module.css, injected globally by Vite) styles the rendered
// markup. The accent follows --color-primary; track follows --color-surface-3.
//
// Accessibility: role="progressbar" with aria-valuemin/max/now when
// determinate (now is dropped + aria-busy set when indeterminate), and an
// aria-label naming what's loading (default "Loading…"). The slide/spin
// animations slow right down under prefers-reduced-motion (the CSS).

import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import styles from "./sc-progress.module.css";

export type ScProgressVariant = "bar" | "spinner";
export type ScProgressSize = "sm" | "md" | "lg";

export class ScProgressBase extends LitElement {
  /** "bar" (horizontal track) or "spinner" (circular ring). */
  @property() accessor variant: ScProgressVariant = "bar";
  /** Completion 0…max. Leave unset for an indeterminate (animated) indicator. */
  @property({ type: Number }) accessor value: number | undefined = undefined;
  /** Upper bound for `value`. */
  @property({ type: Number }) accessor max = 100;
  /** Track height (bar) / diameter (spinner). */
  @property() accessor size: ScProgressSize = "md";
  /** Accessible name for the indicator. */
  @property() accessor label = "Loading…";

  /** Light DOM so the scoped module's (globally injected) classes apply. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  /** value/max clamped to [0,100] as a percentage, or null when indeterminate. */
  private get pct(): number | null {
    if (this.value == null || Number.isNaN(this.value)) return null;
    const max = this.max > 0 ? this.max : 100;
    return Math.min(100, Math.max(0, (this.value / max) * 100));
  }

  render() {
    const pct = this.pct;
    const indeterminate = pct === null;
    const cls = classMap({
      [styles[this.variant]]: true,
      [styles[this.size]]: true,
      [styles.indeterminate]: indeterminate,
      [styles.determinate]: !indeterminate,
    });
    const valueNow = indeterminate ? nothing : String(Math.round(this.value as number));
    const busy = indeterminate ? "true" : nothing;

    if (this.variant === "spinner") {
      // The ring is the host itself; the determinate fill is a conic angle.
      const style = indeterminate ? nothing : styleMap({ "--_pct": String(pct) });
      return html`<span
        class=${cls}
        style=${style}
        role="progressbar"
        aria-label=${this.label}
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${valueNow}
        aria-busy=${busy}
      ></span>`;
    }

    // Bar: a track with a fill child; determinate sets the fill width directly.
    const fillStyle = indeterminate ? nothing : styleMap({ width: `${pct}%` });
    return html`<div
      class=${cls}
      role="progressbar"
      aria-label=${this.label}
      aria-valuemin="0"
      aria-valuemax=${this.max}
      aria-valuenow=${valueNow}
      aria-busy=${busy}
    >
      <div class=${styles.fill} style=${fillStyle}></div>
    </div>`;
  }
}
