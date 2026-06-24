// <sc-progress-base> — a loading / progress indicator. Two shapes (`variant`):
// "bar" (a horizontal track that fills, the default) and "spinner" (a circular
// ring). Each works in two modes, chosen by whether `value` is set:
//   • indeterminate (value unset) — animated; "we're working, no ETA".
//   • determinate (value 0…max)   — fills to value/max; "we're 60% done".
// Shadow DOM: renders the bar/spinner element with literal shape/size/mode
// classes; styling = the shared `foundations` + its own `styles`.
//
// Accessibility: role="progressbar" with aria-valuemin/max/now when
// determinate (now is dropped + aria-busy set when indeterminate), and an
// aria-label naming what's loading (default "Loading…").

import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-progress.scss";

export type ScProgressVariant = "bar" | "spinner";
export type ScProgressSize = "sm" | "md" | "lg";

export class ScProgressBase extends LitElement {
  static styles = [foundations, styles];

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
      [this.variant]: true,
      [this.size]: true,
      indeterminate,
      determinate: !indeterminate,
    });
    const valueNow = indeterminate ? nothing : String(Math.round(this.value as number));
    const busy = indeterminate ? "true" : nothing;

    if (this.variant === "spinner") {
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
      <div class="fill" style=${fillStyle}></div>
    </div>`;
  }
}
