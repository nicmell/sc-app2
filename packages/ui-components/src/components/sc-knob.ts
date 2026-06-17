// <sc-knob-base> — a hidden native <input type="range"> under the SVG dial.
// The range is the value source: keyboard (arrows/Home/End) work natively and
// fire native input/change; our ported pointer-drag + wheel feed the range
// (set value + dispatch native events) rather than emitting a CustomEvent. The
// SVG overlay is purely visual and redraws from `value`.

import { html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScWidgetBase } from "./internal/sc-widget-base";

export class ScKnobBase extends ScWidgetBase {
  @property({ type: Number }) accessor value = 0;
  @property({ type: Number }) accessor min = 0;
  @property({ type: Number }) accessor max = 1;
  @property({ type: Number }) accessor step = 0.01;
  /** Accessible name for the control (→ aria-label on the range input). */
  @property() accessor label = "";

  /** Value announced by screen readers, rounded to the step's precision so it
   *  reads "0.80", not a binary-float tail. */
  private _valueText(): string {
    const precision = Math.max(0, Math.round(-Math.log10(this.step)));
    return this.value.toFixed(precision);
  }

  private get _input(): HTMLInputElement {
    return this.querySelector("input") as HTMLInputElement;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("mousedown", this._onPointerDown);
    this.addEventListener("touchstart", this._onPointerDown, { passive: false });
    this.addEventListener("wheel", this._onWheel, { passive: false });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("mousedown", this._onPointerDown);
    this.removeEventListener("touchstart", this._onPointerDown);
    this.removeEventListener("wheel", this._onWheel);
  }

  /** The range is the source of truth — mirror it onto `value` (redraws SVG). */
  private _onRangeInput = (): void => {
    this.value = Number(this._input.value);
  };

  /** Quantise to `step`, clamp to range. */
  private _quantize(raw: number): number {
    const precision = Math.round(-Math.log10(this.step));
    const factor = 10 ** Math.max(0, precision);
    let v = Math.round((raw - this.min) / this.step) * this.step + this.min;
    v = Math.round(v * factor) / factor;
    return Math.max(this.min, Math.min(this.max, v));
  }

  /** Push a value through the hidden range so it emits native events. */
  private _set(raw: number): boolean {
    const v = this._quantize(raw);
    if (v === this.value) return false;
    this._input.value = String(v);
    this._input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  private _onPointerDown = (e: MouseEvent | TouchEvent): void => {
    if (this.disabled) return;
    e.preventDefault();
    this._input.focus();
    const ev = "touches" in e ? e.touches[0] : e;
    const startX = ev.clientX;
    const startY = ev.clientY;
    const startValue = this.value;
    const range = this.max - this.min;
    const sensitivity = (this.getBoundingClientRect().width || 40) * 1.5;
    let moved = false;

    const onMove = (me: MouseEvent | TouchEvent): void => {
      me.preventDefault();
      const mev = "touches" in me ? me.touches[0] : me;
      const dx = mev.clientX - startX;
      const dy = startY - mev.clientY;
      const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      let dv = (d / sensitivity) * range;
      if (me instanceof MouseEvent && me.shiftKey) dv *= 0.2;
      if (this._set(startValue + dv)) moved = true;
    };

    const onUp = (): void => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      document.removeEventListener("touchcancel", onUp);
      if (moved) this._input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
    document.addEventListener("touchcancel", onUp);
  };

  private _onWheel = (e: WheelEvent): void => {
    if (this.disabled) return;
    e.preventDefault();
    let delta = e.deltaY > 0 ? -this.step : this.step;
    if (!e.shiftKey) delta *= 5;
    if (this._set(this.value + delta)) {
      this._input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

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
          aria-valuetext=${this._valueText()}
          ?disabled=${this.disabled}
          @input=${this._onRangeInput}
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
