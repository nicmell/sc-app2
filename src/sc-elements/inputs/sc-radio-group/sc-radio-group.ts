// <sc-radio-group> — a radio set over its sc-radio children, bound to a
// control/var (`bind`/`_targetScNode` on the ScInput base). Renders the
// ui-components <sc-base-radio-group>, projecting each sc-radio's collected
// {value,label} into an <sc-base-radio>. The sc-radio children are pure data
// (consumed at parse, never enabled); the shared ScInput seam syncs the
// selection from the target's `_state` and dispatches the chosen value.

import { html } from "lit";
import { state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import type { ScRadioGroupBase } from "@sc-app/ui-components/lit";
import { ScInput } from "@/sc-elements/internal/sc-input";
import type { ScRadio } from "@/sc-elements/inputs/sc-radio";
import "@sc-app/ui-components/lit";

export class ScRadioGroup extends ScInput {
  @state() accessor _value = 0;

  /** The declarative choices — read lazily from the parsed children: the
   *  radio-group is a transparent container, so its sc-radio children are
   *  processed by the ENCLOSING level (after this element) and attach here
   *  as their parse parent. Lit's first update runs after the synchronous
   *  parse, so render always sees them. */
  get _options(): Array<{ value: number; label: string }> {
    return (this._scChildren ?? [])
      .filter((c): c is ScRadio => c.tagName.toLowerCase() === "sc-radio")
      .map((r) => ({ value: r.getProp("value") as number, label: r.getProp("label") as string }));
  }

  protected syncFromState(value: number | undefined): void {
    if (value !== undefined) this._value = value;
  }

  private onChange = (e: Event) => {
    this.commit((e.target as ScRadioGroupBase).value);
  };

  render() {
    return html`<sc-base-radio-group
      orientation=${this.getProp("orientation")}
      label=${this.getProp("label")}
      size=${this.getProp("size")}
      ?disabled=${this.getProp("disabled")}
      .value=${live(this._value)}
      @change=${this.onChange}
    >
      ${this._options.map(
        (o) => html`<sc-base-radio value=${o.value} label=${o.label}></sc-base-radio>`,
      )}
    </sc-base-radio-group>`;
  }
}
