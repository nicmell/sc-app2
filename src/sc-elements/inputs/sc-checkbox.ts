// <sc-checkbox> — a toggle bound to a control/var. Deliberately unstyled for
// now: a native <input type="checkbox"> (the switch UI returns with the
// inputs migration step). Changing it is a stub — the bound control doesn't
// move yet.

import { html } from "lit";
import { property } from "lit/decorators.js";
import type { ScCheckboxRuntime, ScCheckboxProps } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScCheckbox extends ScElement<ScCheckboxRuntime> implements ScCheckboxProps {
  @property() accessor bind = "";

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
