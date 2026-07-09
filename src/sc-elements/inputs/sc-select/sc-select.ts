// <sc-select> — a dropdown over its sc-option children, bound to a control/var
// (`bind`/`_targetScNode` on the ScInput base). Renders the ui-components
// <sc-base-select>, projecting each sc-option's collected {value,label} into an
// <sc-base-option>. The sc-option children are pure data (consumed at parse,
// never enabled); the shared ScInput seam syncs the selection from the target's
// `_state` and dispatches the chosen value through commit().

import { html } from "lit";
import { state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import type { ScSelectBase } from "@sc-app/ui-components/lit";
import { ScInput } from "@/sc-elements/internal/sc-input";
import type { ScOption } from "@/sc-elements/inputs/sc-option";
import "@sc-app/ui-components/lit";

export class ScSelect extends ScInput {
  @state() accessor _value = 0;

  /** The declarative choices — read lazily from the parsed children: sc-select
   *  is a transparent container, so its sc-option children are processed by
   *  the ENCLOSING level (after this element) and attach here as their parse
   *  parent. Lit's first update runs after the synchronous parse, so render
   *  always sees them. */
  get _options(): Array<{ value: number; label: string }> {
    return (this._scChildren ?? [])
      .filter((c): c is ScOption => c.tagName.toLowerCase() === "sc-option")
      .map((o) => ({ value: o.getProp("value") as number, label: o.getProp("label") as string }));
  }

  protected syncFromState(value: number | undefined): void {
    if (value !== undefined) this._value = value;
  }

  private onChange = (e: Event) => {
    this.commit((e.target as ScSelectBase).value);
  };

  render() {
    return html`<sc-base-select
      placeholder=${this.getProp("placeholder")}
      size=${this.getProp("size")}
      ?disabled=${this.getProp("disabled")}
      .value=${live(this._value)}
      @change=${this.onChange}
    >
      ${this._options.map(
        (o) => html`<sc-base-option value=${o.value} label=${o.label}></sc-base-option>`,
      )}
    </sc-base-select>`;
  }
}
