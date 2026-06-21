// <sc-slider-base> — a hidden native <input type="range"> under the
// track/fill/thumb overlay. The value plumbing (range mirror, quantise,
// pointer-drag, wheel) lives in ScRangeBase; this file is the track visual +
// the slider's drag feel: dragging along the `orientation` axis over a travel
// equal to the track length. `orientation` only affects the visual + axis.

import { html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScRangeBase } from "./internal/sc-range-base";

export class ScSliderBase extends ScRangeBase {
  @property() accessor orientation: "horizontal" | "vertical" = "horizontal";

  /** Drag along the orientation axis: up (vertical) or right (horizontal). */
  protected dragAxisDelta(dx: number, dy: number): number {
    return this.orientation === "vertical" ? dy : dx;
  }

  protected dragSensitivity(rect: DOMRect): number {
    return (this.orientation === "vertical" ? rect.height : rect.width) || 100;
  }

  render() {
    const vertical = this.orientation === "vertical";
    const range = this.max - this.min;
    const ratio = range > 0 ? Math.max(0, Math.min(1, (this.value - this.min) / range)) : 0;
    const pct = `${ratio * 100}%`;
    const fillStyle = vertical ? `height:${pct}` : `width:${pct}`;
    const thumbStyle = vertical ? `bottom:${pct}` : `left:${pct}`;
    return html`
      <div
        class=${this.blockClasses("sc-slider", {
          "sc-slider--vertical": vertical,
          "sc-slider--horizontal": !vertical,
        })}
      >
        <input
          class="sc-slider__input sr-only"
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
        <div class="sc-slider__track">
          <div class="sc-slider__fill" style=${fillStyle}></div>
          <div class="sc-slider__thumb" style=${thumbStyle}></div>
        </div>
      </div>
    `;
  }
}
