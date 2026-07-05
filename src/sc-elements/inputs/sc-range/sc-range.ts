// <sc-range> — a range input bound to a control/var (`bind`/`_targetScNode`
// on the ScInput base). Deliberately unstyled for now: a native <input
// type="range">; the knob/slider internals return with a later step. The
// load pass wires it to the target's live value: reads come through the
// uniform `_state` + `onStateChange()` seam (literal or derived alike),
// writes go through the target's `setValue()` (the /n_set dispatch point).

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { isStateRuntime } from "@/lib/utils/guards";
import type {} from "@/types/runtime";
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
    if (target && isStateRuntime(target) && target.enabled) {
      const v = target._state;
      if (v !== undefined) this.value = v; // statechange is change-only — sync once
      this.offValue = target.onStateChange((next) => (this.value = next));
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
    const target = this._targetScNode;
    if (target && isStateRuntime(target)) target.setValue(value);
    // Re-read instead of trusting the gesture: a write to BOUND (derived,
    // read-only) state is inert, and `live()` then snaps the thumb back to
    // the real value. For a literal target the synchronous statechange echo
    // has already synced `_state` — a no-op.
    this.value = target && isStateRuntime(target) ? (target._state ?? value) : value;
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
