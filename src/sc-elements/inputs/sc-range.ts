// <sc-range> — a range input bound to a control (`bind`/`_targetScNode` on
// the ScInput base). Deliberately unstyled for now: a native <input
// type="range">; the knob/slider internals return with a later step. The
// load pass wires it to the target control's store key: reads (initial value
// + external store writes) come through the control's `selectValue()` view,
// writes go through the control's `setValue()` (the /n_set dispatch point).

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { isControlRuntime } from "@/lib/utils/guards";
import type {  } from "@/types/runtime";
import { requireNumeric } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";

export class ScRange extends ScInput {
  @property({ type: Number }) accessor min = 0;
  @property({ type: Number }) accessor max = 1;
  @property({ type: Number }) accessor step = 0.01;
  @property({ type: Number }) accessor value = 0;

  private offValue?: () => void;

  validate(): void {
    requireNumeric(this, "min", this.min);
    requireNumeric(this, "max", this.max);
    requireNumeric(this, "step", this.step);
    requireNumeric(this, "value", this.value);
  }

  async load(): Promise<void> {
    this.offValue?.(); // re-entrant: drop the stale subscription on reload
    this.offValue = undefined;
    const target = this._targetScNode;
    if (target && isControlRuntime(target) && target.enabled) {
      const view = target.selectValue();
      const v = view.get();
      if (v !== undefined) this.value = v; // initial render = the store default
      this.offValue = view.subscribe((v) => {
        if (v !== undefined) this.value = v;
      });
    }
    await super.load();
  }

  unload(): void {
    super.unload();
    this.offValue?.();
    this.offValue = undefined;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.offValue?.();
    this.offValue = undefined;
  }

  private onInput = (e: Event) => {
    const value = Number((e.target as HTMLInputElement).value);
    this.value = value;
    const target = this._targetScNode;
    if (target && isControlRuntime(target)) target.setValue(value);
  };

  render() {
    return html`<input
      type="range"
      min=${this.min}
      max=${this.max}
      step=${this.step}
      .value=${live(String(this.value))}
      @input=${this.onInput}
    />`;
  }
}
