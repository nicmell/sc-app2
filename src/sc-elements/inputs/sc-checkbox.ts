// <sc-checkbox> — a toggle bound to a control/var (`bind`/`targetId` on the
// ScInput base). Deliberately unstyled for now: a native <input
// type="checkbox"> (the switch UI returns with the inputs migration step).
// Changing it is a stub — the bound control doesn't move yet.

import { html } from "lit";
import type { ScCheckboxProps } from "@/types/runtime";
import { ScInput } from "@/sc-elements/internal/sc-input";

export class ScCheckbox extends ScInput implements ScCheckboxProps {
  validate(): void {
    this.requireProp("bind", this.bind);
  }

  private onChange = (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    // Stub: control propagation arrives with the inputs migration step.
    console.debug(`[sc-checkbox] ${this.bind || "(unbound)"} → ${checked ? 1 : 0}`);
  };

  render() {
    return html`<input type="checkbox" @change=${this.onChange} />`;
  }
}
