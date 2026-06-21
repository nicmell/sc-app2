// <sc-inputnumber-base> — a numeric text field. Wraps a native <input
// type="number"> (whose native spin buttons the foundation hides) and renders
// its own up/down stepper arrows, themed via tokens. The native input/change
// flow to consumers (read e.target.value); typing is clamped to min/max on
// commit (change/blur), and the steppers drive the native input directly.

import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import cx from "classnames";
import type { ScInputSize } from "../sc-input/sc-input";
import inputStyles from "../sc-input/sc-input.module.css";
import styles from "./sc-inputnumber.module.css";

export class ScInputNumberBase extends LitElement {
  @property({ type: Number }) accessor value = 0;
  @property({ type: Number }) accessor min = -Infinity;
  @property({ type: Number }) accessor max = Infinity;
  @property({ type: Number }) accessor step = 1;
  @property() accessor placeholder = "";
  @property() accessor name = "";
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

  private get _input(): HTMLInputElement {
    return this.querySelector("input") as HTMLInputElement;
  }

  // Free typing: sync the parsed value (no clamp mid-edit); native input bubbles.
  private _onInput = (e: Event): void => {
    const n = Number.parseFloat((e.target as HTMLInputElement).value);
    if (!Number.isNaN(n)) this.value = n;
  };

  // Commit (blur/Enter): clamp + reconcile the field; native change bubbles.
  private _onChange = (): void => {
    const n = Number.parseFloat(this._input.value);
    const v = Number.isNaN(n) ? this.value : this._clamp(n);
    this.value = v;
    this._input.value = String(v);
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
      <div
        class=${cx(styles.root, styles[this.size], {
          [styles.disabled]: this.disabled,
        })}
      >
        <input
          class=${cx(inputStyles.root, styles.field)}
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
        <span class=${styles.spinners}>
          <button
            type="button"
            class=${cx(styles.step, styles.stepUp)}
            tabindex="-1"
            aria-label="Increment"
            ?disabled=${this.disabled}
            @click=${() => this._stepBy(1)}
          >
            <span class=${cx(styles.arrow, styles.arrowUp)}></span>
          </button>
          <button
            type="button"
            class=${cx(styles.step, styles.stepDown)}
            tabindex="-1"
            aria-label="Decrement"
            ?disabled=${this.disabled}
            @click=${() => this._stepBy(-1)}
          >
            <span class=${cx(styles.arrow, styles.arrowDown)}></span>
          </button>
        </span>
      </div>
    `;
  }
}
