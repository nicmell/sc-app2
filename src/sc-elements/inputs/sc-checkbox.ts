// <sc-checkbox> — a toggle bound to a control (`bind`/`_targetScNode` on the
// ScInput base). Deliberately unstyled for now: a native <input
// type="checkbox"> (the switch UI returns with a later step). Checked maps to
// the control value 1, unchecked to 0; the load pass subscribes the checked
// state to the target's store key and writes go through the control's
// `setValue()` (the /n_set dispatch point).

import { html } from "lit";
import { state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { isControlRuntime } from "@/lib/utils/guards";
import type {  } from "@/types/runtime";
import { requireProp } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";

export class ScCheckbox extends ScInput {
  @state() accessor _checked = false;

  private offValue?: () => void;

  validate(): void {
    requireProp(this, "bind", this.bind);
  }

  async load(): Promise<void> {
    const target = this._targetScNode;
    if (target && isControlRuntime(target) && target.enabled) {
      const view = target.selectValue();
      this._checked = (view.get() ?? 0) !== 0;
      this.offValue = view.subscribe((v) => {
        if (v !== undefined) this._checked = v !== 0;
      });
    }
    await super.load();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.offValue?.();
    this.offValue = undefined;
  }

  private onChange = (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    const target = this._targetScNode;
    if (target && isControlRuntime(target)) target.setValue(checked ? 1 : 0);
  };

  render() {
    // live(): the user mutates the native input directly, so the binding
    // must compare against the DOM value, not the last committed render.
    return html`<input type="checkbox" .checked=${live(this._checked)} @change=${this.onChange} />`;
  }
}
