// <sc-slider-base> — a hidden native <input type="range"> under the
// track/fill/thumb overlay. The range is the value source (native keyboard +
// native input/change); our ported pointer-drag + wheel feed it. `orientation`
// only affects the visual; the visual redraws from `value`.

import { html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScWidgetBase } from "./internal/sc-widget-base";
import { resetStyles } from "./internal/reset.styles";
import { widgetBaseStyles } from "./internal/widget-base.styles";
import { sliderStyles } from "./sc-slider.styles";

export class ScSliderBase extends ScWidgetBase {
  @property({ type: Number }) accessor value = 0;
  @property({ type: Number }) accessor min = 0;
  @property({ type: Number }) accessor max = 1;
  @property({ type: Number }) accessor step = 0.01;
  @property() accessor orientation: "horizontal" | "vertical" = "horizontal";
  /** Accessible name for the control (→ aria-label on the range input). */
  @property() accessor label = "";

  static styles = [resetStyles, widgetBaseStyles, sliderStyles];

  static formAssociated = true;

  readonly #internals: ElementInternals | undefined = (() => {
    try {
      return this.attachInternals();
    } catch {
      return undefined;
    }
  })();

  protected updated(): void {
    this.#internals?.setFormValue(String(this.value));
  }

  /** Value announced by screen readers, rounded to the step's precision. */
  private _valueText(): string {
    const precision = Math.max(0, Math.round(-Math.log10(this.step)));
    return this.value.toFixed(precision);
  }

  private get _input(): HTMLInputElement {
    return this.renderRoot.querySelector("input") as HTMLInputElement;
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

  private _onRangeInput = (e: Event): void => {
    this.value = Number(this._input.value);
    this.reemit(e);
  };
  private _onRangeChange = (e: Event): void => {
    this.reemit(e);
  };

  private _quantize(raw: number): number {
    const precision = Math.round(-Math.log10(this.step));
    const factor = 10 ** Math.max(0, precision);
    let v = Math.round((raw - this.min) / this.step) * this.step + this.min;
    v = Math.round(v * factor) / factor;
    return Math.max(this.min, Math.min(this.max, v));
  }

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
    const vertical = this.orientation === "vertical";
    const rect = this.getBoundingClientRect();
    const sensitivity = (vertical ? rect.height : rect.width) || 100;
    let moved = false;

    const onMove = (me: MouseEvent | TouchEvent): void => {
      me.preventDefault();
      const mev = "touches" in me ? me.touches[0] : me;
      const dx = mev.clientX - startX;
      const dy = startY - mev.clientY;
      const d = vertical ? dy : dx;
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
          aria-valuetext=${this._valueText()}
          ?disabled=${this.disabled}
          @input=${this._onRangeInput}
          @change=${this._onRangeChange}
        />
        <div class="sc-slider__track">
          <div class="sc-slider__fill" style=${fillStyle}></div>
          <div class="sc-slider__thumb" style=${thumbStyle}></div>
        </div>
      </div>
    `;
  }
}
