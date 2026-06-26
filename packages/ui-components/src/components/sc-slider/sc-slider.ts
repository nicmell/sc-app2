// <sc-slider-base> — a hidden native <input type="range"> under the
// track/fill/thumb overlay. The value plumbing (range mirror, quantise,
// pointer-drag, wheel, composed event re-emit) lives in ScRangeBase; this file
// is the track visual + the slider's drag feel: dragging along the `orientation`
// axis over a travel equal to the track length.

import { html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScRangeBase } from "../internal/sc-range/sc-range";
import foundations from "../../foundations/shadow.scss";
import controlStyles from "../../foundations/base/controls.scss";
import styles from "./sc-slider.scss";

export class ScSliderBase extends ScRangeBase {
  static styles = [foundations, controlStyles, styles];

  @property({ reflect: true }) accessor orientation: "horizontal" | "vertical" = "horizontal";

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
      <div>
        <input
          class="input sr-only"
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
          @change=${this.onRangeChange}
        />
        <div class="track">
          <div class="fill" style=${fillStyle}></div>
          <div class="thumb" style=${thumbStyle}></div>
        </div>
      </div>
    `;
  }
}
