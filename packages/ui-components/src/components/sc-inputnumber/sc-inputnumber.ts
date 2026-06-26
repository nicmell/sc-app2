// <sc-inputnumber-base> — a numeric text field. Shadow DOM: wraps a native
// <input type="number"> styled by `controlStyles` (whose bare rule also hides the
// native spin buttons) and renders its own up/down stepper arrows. The native
// input/change are re-emitted (composed) from the host (read e.target.value); typing is
// clamped to min/max on commit (change/blur), and the steppers drive the native input.

import { html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScControlBase } from "../internal/sc-control/sc-control";
import resetStyles from "../../foundations/reset.scss";
import controlStyles from "../../foundations/controls.scss";
import styles from "./sc-inputnumber.scss";
import "../sc-icon/sc-icon";

export class ScInputNumberBase extends ScControlBase {
  static styles = [resetStyles, controlStyles, styles];

  @property({ type: Number }) accessor value = 0;
  @property({ type: Number }) accessor min = -Infinity;
  @property({ type: Number }) accessor max = Infinity;
  @property({ type: Number }) accessor step = 1;
  @property() accessor placeholder = "";

  private _clamp(n: number): number {
    return Math.min(this.max, Math.max(this.min, n));
  }

  /** Round to the precision implied by `step` to avoid float drift. */
  private _quantize(n: number): number {
    if (!Number.isFinite(this.step) || this.step <= 0) return n;
    const factor = 10 ** Math.max(0, Math.round(-Math.log10(this.step)));
    return Math.round(n * factor) / factor;
  }

  private get _input(): HTMLInputElement {
    return this.renderRoot.querySelector("input") as HTMLInputElement;
  }

  // Free typing: sync the parsed value (no clamp mid-edit); re-emit composed input.
  private _onInput = (e: Event): void => {
    e.stopPropagation();
    const n = Number.parseFloat((e.target as HTMLInputElement).value);
    if (!Number.isNaN(n)) this.value = n;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  };

  // Commit (blur/Enter): clamp + reconcile the field; re-emit composed change.
  private _onChange = (e: Event): void => {
    e.stopPropagation();
    const n = Number.parseFloat(this._input.value);
    const v = Number.isNaN(n) ? this.value : this._clamp(n);
    this.value = v;
    this._input.value = String(v);
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  private _stepBy(dir: 1 | -1): void {
    if (this.disabled) return;
    const base = Number.isFinite(this.value) ? this.value : 0;
    const v = this._clamp(this._quantize(base + dir * this.step));
    if (v === this.value) return;
    this._input.value = String(v);
    this._input.dispatchEvent(new Event("input", { bubbles: true }));
    this._input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  render() {
    return html`
      <div>
        <input
          class="field"
          type="number"
          name=${this.name}
          placeholder=${this.placeholder}
          min=${Number.isFinite(this.min) ? this.min : nothing}
          max=${Number.isFinite(this.max) ? this.max : nothing}
          step=${this.step}
          ?disabled=${this.disabled}
          .value=${live(String(this.value))}
          @input=${this._onInput}
          @change=${this._onChange}
        />
        <span class="spinners">
          <button
            type="button"
            class="step stepUp"
            tabindex="-1"
            aria-label="Increment"
            ?disabled=${this.disabled}
            @click=${() => this._stepBy(1)}
          >
            <sc-icon-base name="caret-up"></sc-icon-base>
          </button>
          <button
            type="button"
            class="step stepDown"
            tabindex="-1"
            aria-label="Decrement"
            ?disabled=${this.disabled}
            @click=${() => this._stepBy(-1)}
          >
            <sc-icon-base name="caret-down"></sc-icon-base>
          </button>
        </span>
      </div>
    `;
  }
}
