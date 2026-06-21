// Shared base for the range-backed widgets (sc-knob, sc-slider). Both sit a
// hidden native <input type="range"> (the value source — native keyboard +
// input/change) under a visual overlay, and feed it from a ported pointer-drag
// + wheel (set value + dispatch native events, no CustomEvent). Everything
// except the visual is identical, so it lives here: the value props, the
// quantise/clamp, the range mirror, and the drag/wheel handlers.
//
// Subclasses supply two things:
//   - render() — the visual overlay (SVG dial, track/fill/thumb, …) over a
//     hidden `<input class="…__input sr-only" …>` bound to value/onRangeInput.
//   - the drag hooks — dragAxisDelta() (the signed pixel displacement for a
//     gesture frame; dx is right-positive, dy is up-positive) and
//     dragSensitivity() (pixels of travel that sweep the full range, scaled to
//     the widget's size). These are the ONLY behavioural difference between a
//     knob (dominant axis, width-based) and a slider (orientation axis,
//     track-length-based).

import { property } from "lit/decorators.js";
import { ScWidgetBase } from "./sc-widget-base";

export abstract class ScRangeBase extends ScWidgetBase {
  @property({ type: Number }) accessor value = 0;
  @property({ type: Number }) accessor min = 0;
  @property({ type: Number }) accessor max = 1;
  @property({ type: Number }) accessor step = 0.01;
  /** Accessible name for the control (→ aria-label on the range input). */
  @property() accessor label = "";

  /** Value announced by screen readers, rounded to the step's precision so it
   *  reads "0.80", not a binary-float tail. */
  protected valueText(): string {
    const precision = Math.max(0, Math.round(-Math.log10(this.step)));
    return this.value.toFixed(precision);
  }

  protected get input(): HTMLInputElement {
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

  /** The range is the source of truth — mirror it onto `value` (redraws the
   *  visual) and re-emit a composed `input` from the host (the native event
   *  doesn't cross the shadow boundary). Bind as the input's `@input` handler. */
  protected onRangeInput = (e: Event): void => {
    e.stopPropagation();
    this.value = Number(this.input.value);
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  };

  /** Re-emit a composed `change` from the host. Bind as the input's `@change`. */
  protected onRangeChange = (e: Event): void => {
    e.stopPropagation();
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
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
    this.input.value = String(v);
    this.input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  /** The signed pixel displacement for a drag frame (dx right-positive, dy
   *  up-positive). Knob: dominant axis; slider: the orientation axis. */
  protected abstract dragAxisDelta(dx: number, dy: number): number;

  /** Pixels of drag that sweep the full min→max range (scales with the widget
   *  size). Knob: width × 1.5; slider: the track length. */
  protected abstract dragSensitivity(rect: DOMRect): number;

  private _onPointerDown = (e: MouseEvent | TouchEvent): void => {
    if (this.disabled) return;
    e.preventDefault();
    this.input.focus();
    const ev = "touches" in e ? e.touches[0] : e;
    const startX = ev.clientX;
    const startY = ev.clientY;
    const startValue = this.value;
    const range = this.max - this.min;
    const sensitivity = this.dragSensitivity(this.getBoundingClientRect());
    let moved = false;

    const onMove = (me: MouseEvent | TouchEvent): void => {
      me.preventDefault();
      const mev = "touches" in me ? me.touches[0] : me;
      const dx = mev.clientX - startX;
      const dy = startY - mev.clientY;
      let dv = (this.dragAxisDelta(dx, dy) / sensitivity) * range;
      if (me instanceof MouseEvent && me.shiftKey) dv *= 0.2;
      if (this._set(startValue + dv)) moved = true;
    };

    const onUp = (): void => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      document.removeEventListener("touchcancel", onUp);
      if (moved) this.input.dispatchEvent(new Event("change", { bubbles: true }));
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
      this.input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };
}
