// <sc-knob-base> — a hidden native <input type="range"> under the SVG dial.
// The value plumbing (range mirror, quantise, pointer-drag, wheel) lives in
// ScRangeBase; this file is just the dial visual + the knob's drag feel:
// dragging along whichever axis dominates the gesture, over a travel that
// scales with the knob's width. The SVG overlay redraws from `value`.

import { html, nothing } from "lit";
import { live } from "lit/directives/live.js";
import { ScRangeBase } from "./internal/sc-range-base";

export class ScKnobBase extends ScRangeBase {
  /** Dominant axis: up OR right increases (whichever the user moved more). */
  protected dragAxisDelta(dx: number, dy: number): number {
    return Math.abs(dx) > Math.abs(dy) ? dx : dy;
  }

  protected dragSensitivity(rect: DOMRect): number {
    return (rect.width || 40) * 1.5;
  }

  render() {
    const range = this.max - this.min;
    const ratio = range > 0 ? Math.max(0, Math.min(1, (this.value - this.min) / range)) : 0;
    const angle = -135 + 270 * ratio;
    return html`
      <div class=${this.blockClasses("sc-knob")}>
        <input
          class="sc-knob__input sr-only"
          type="range"
          name=${this.name}
          min=${this.min}
          max=${this.max}
          step=${this.step}
          .value=${live(String(this.value))}
          aria-label=${this.label || nothing}
          aria-valuetext=${this.valueText()}
          ?disabled=${this.disabled}
          @input=${this.onRangeInput}
        />
        <svg class="sc-knob__svg" viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <circle class="sc-knob__body" cx="50" cy="50" r="47" />
          <line
            class="sc-knob__indicator"
            x1="50"
            y1="44"
            x2="50"
            y2="11"
            transform="rotate(${angle} 50 50)"
          />
        </svg>
      </div>
    `;
  }
}
