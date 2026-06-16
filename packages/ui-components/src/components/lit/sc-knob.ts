// <sc-knob-base> — a UI-only rotary knob, ported from the old sc-app internal
// sc-knob (SVG arc + indicator, pointer-drag + wheel), dropping the sprite-sheet
// and free-form colour/diameter props. Geometry is normalised (0..100 viewBox);
// the rendered size comes from the size class (foundations/components/sc-knob.css)
// and the drag sensitivity from the live bounding box. Emits `change` on commit.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { ScInputBase } from "./internal/sc-input-base";

export class ScKnobBase extends ScInputBase {
  @property({ type: Number }) accessor value = 0;
  @property({ type: Number }) accessor min = 0;
  @property({ type: Number }) accessor max = 1;
  @property({ type: Number }) accessor step = 0.01;

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

  private _onPointerDown = (e: MouseEvent | TouchEvent): void => {
    if (this.disabled) return;
    e.preventDefault();
    const ev = "touches" in e ? e.touches[0] : e;
    const startX = ev.clientX;
    const startY = ev.clientY;
    const startValue = this.value;
    const range = this.max - this.min;
    const sensitivity = (this.getBoundingClientRect().width || 40) * 1.5;

    const onMove = (me: MouseEvent | TouchEvent): void => {
      me.preventDefault();
      const mev = "touches" in me ? me.touches[0] : me;
      const dx = mev.clientX - startX;
      const dy = startY - mev.clientY;
      const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      let dv = (d / sensitivity) * range;
      if (me instanceof MouseEvent && me.shiftKey) dv *= 0.2;
      this._commit(startValue + dv);
    };

    const onUp = (): void => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      document.removeEventListener("touchcancel", onUp);
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
    this._commit(this.value + delta);
  };

  /** Quantise to `step`, clamp to range, and emit if the value actually moved. */
  private _commit(raw: number): void {
    const precision = Math.round(-Math.log10(this.step));
    const factor = 10 ** Math.max(0, precision);
    let v = Math.round((raw - this.min) / this.step) * this.step + this.min;
    v = Math.round(v * factor) / factor;
    v = Math.max(this.min, Math.min(this.max, v));
    if (v !== this.value) {
      this.value = v;
      this.emit(v);
    }
  }

  render() {
    const range = this.max - this.min;
    const ratio = range > 0 ? (this.value - this.min) / range : 0;
    const angle = -135 + 270 * Math.max(0, Math.min(1, ratio));
    return html`
      <div class=${this.blockClasses("sc-knob")}>
        <svg class="sc-knob__svg" viewBox="0 0 100 100" width="100%" height="100%">
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
