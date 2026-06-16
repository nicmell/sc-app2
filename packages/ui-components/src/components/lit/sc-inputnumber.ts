// <sc-inputnumber-base> — a numeric text field. Wraps a native <input
// type="number"> (whose native spin buttons the foundation hides) and renders
// its own up/down stepper arrows, themed via tokens. Holds `value` as a number,
// clamps to min/max, steps by `step`, and dispatches a single `change`
// CustomEvent ({ value: number }) — the native input/change are swallowed.

import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import cx from "classnames";
import type { ScInputSize } from "./sc-input";

export class ScInputNumberBase extends LitElement {
  @property({ type: Number }) accessor value = 0;
  @property({ type: Number }) accessor min = -Infinity;
  @property({ type: Number }) accessor max = Infinity;
  @property({ type: Number }) accessor step = 1;
  @property() accessor placeholder = "";
  @property() accessor size: ScInputSize = "md";
  @property({ type: Boolean }) accessor disabled = false;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private _clamp(n: number): number {
    return Math.min(this.max, Math.max(this.min, n));
  }

  /** Round to the precision implied by `step` to avoid float drift. */
  private _quantize(n: number): number {
    if (!Number.isFinite(this.step) || this.step <= 0) return n;
    const factor = 10 ** Math.max(0, Math.round(-Math.log10(this.step)));
    return Math.round(n * factor) / factor;
  }

  private _commit(n: number): void {
    const next = this._clamp(this._quantize(n));
    if (next !== this.value) {
      this.value = next;
      this.dispatchEvent(
        new CustomEvent("change", { detail: { value: next }, bubbles: true, composed: true }),
      );
    }
  }

  private _stepBy(dir: 1 | -1): void {
    if (this.disabled) return;
    const base = Number.isFinite(this.value) ? this.value : 0;
    this._commit(base + dir * this.step);
  }

  // Free typing: emit the parsed value (no clamping mid-edit); ignore empty/NaN.
  private _onInput = (e: Event): void => {
    e.stopPropagation();
    const raw = (e.target as HTMLInputElement).value;
    const n = Number.parseFloat(raw);
    if (Number.isNaN(n)) return;
    this.value = n;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: n }, bubbles: true, composed: true }),
    );
  };

  private _swallow = (e: Event): void => {
    e.stopPropagation();
  };

  render() {
    return html`
      <div
        class=${cx("sc-inputnumber", `sc-inputnumber--${this.size}`, {
          "sc-inputnumber--disabled": this.disabled,
        })}
      >
        <input
          class="sc-input sc-inputnumber__field"
          type="number"
          placeholder=${this.placeholder}
          min=${Number.isFinite(this.min) ? this.min : nothing}
          max=${Number.isFinite(this.max) ? this.max : nothing}
          step=${this.step}
          ?disabled=${this.disabled}
          .value=${live(String(this.value))}
          @input=${this._onInput}
          @change=${this._swallow}
        />
        <span class="sc-inputnumber__spinners">
          <button
            type="button"
            class="sc-inputnumber__step"
            tabindex="-1"
            aria-label="Increment"
            ?disabled=${this.disabled}
            @click=${() => this._stepBy(1)}
          >
            <span class="sc-inputnumber__arrow sc-inputnumber__arrow--up"></span>
          </button>
          <button
            type="button"
            class="sc-inputnumber__step"
            tabindex="-1"
            aria-label="Decrement"
            ?disabled=${this.disabled}
            @click=${() => this._stepBy(-1)}
          >
            <span class="sc-inputnumber__arrow sc-inputnumber__arrow--down"></span>
          </button>
        </span>
      </div>
    `;
  }
}
