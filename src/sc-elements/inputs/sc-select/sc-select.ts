// <sc-select> — a dropdown over its sc-option children, bound to a control/var
// (`bind:value` on the ScInput base). Renders the ui-components
// <sc-base-select>, projecting each sc-option's collected {value,label} into an
// <sc-base-option>. The sc-option children are pure data (consumed at parse,
// never live); the shared ScInput seam syncs the selection from the target's
// `_state` and dispatches the chosen value through commit().

import { html } from "lit";
import { state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ifDefined } from "lit/directives/if-defined.js";
import type { ScSelectBase } from "@sc-app/ui-components/lit";
import { ScInput } from "@/sc-elements/internal/sc-input";
import type { ScOption } from "@/sc-elements/inputs/sc-option";
import "@sc-app/ui-components/lit";

export class ScSelect extends ScInput {
  @state() accessor _value = 0;

  /** The declarative choices — read lazily from the authored DOM children:
   *  sc-select is a transparent container, so its sc-option children belong to
   *  the ENCLOSING node's runtime tree (`_parentScNode` walks through
   *  transparency) — the DOM is the one place they stay this element's. Lit's
   *  first update runs after the synchronous parse, so render sees them
   *  upgraded. */
  get _options(): Array<{ value: number; label: string }> {
    return Array.from(this.children)
      .filter((c): c is ScOption => c.tagName.toLowerCase() === "sc-option")
      .map((o) => ({ value: o.getProp("value") as number, label: o.getProp("label") as string }));
  }

  protected syncFromState(value: number | string | undefined): void {
    const n = this.numericState(value);
    if (n !== undefined) this._value = n;
  }

  private onChange = (e: Event) => {
    this.commit((e.target as ScSelectBase).value);
  };

  render() {
    return html`<sc-base-select
      placeholder=${ifDefined(this.getProp("placeholder"))}
      size=${ifDefined(this.getProp("size"))}
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
