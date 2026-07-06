// <sc-select> — a dropdown over its sc-option children, bound to a control/var
// (`bind`/`_targetScNode` on the ScInput base). Renders the ui-components
// <sc-base-select>, projecting each sc-option's collected {value,label} into an
// <sc-base-option>. The sc-option children are pure data (consumed at parse,
// never enabled); the shared ScInput seam syncs the selection from the target's
// `_state` and dispatches the chosen value through commit().

import { html } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import type { ScSize, ScSelectBase } from "@sc-app/ui-components/lit";
import type { InputRuntime, RuntimeContext } from "@/types/runtime";
import { requireProp } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";
import type { ScOption } from "@/sc-elements/inputs/sc-option";
import "@sc-app/ui-components/lit";

export class ScSelect extends ScInput {
  @property() accessor placeholder = "";
  @property() accessor size: ScSize = "md";
  @property({ type: Boolean }) accessor disabled = false;

  /** The declarative choices, collected from the sc-option children at parse. */
  _options: Array<{ value: number; label: string }> = [];

  @state() accessor _value = 0;

  validate(): void {
    requireProp(this, "bind", this.bind);
  }

  protected resolveRuntime(ctx: RuntimeContext): InputRuntime {
    this.processChildren(ctx);
    this._options = (this._scChildren ?? [])
      .filter((c): c is ScOption => c.tagName.toLowerCase() === "sc-option")
      .map((o) => ({ value: o.value, label: o.label }));
    return super.resolveRuntime(ctx);
  }

  protected syncFromState(value: number | undefined): void {
    if (value !== undefined) this._value = value;
  }

  private onChange = (e: Event) => {
    this.commit((e.target as ScSelectBase).value);
  };

  render() {
    return html`<sc-base-select
      placeholder=${this.placeholder}
      size=${this.size}
      ?disabled=${this.disabled}
      .value=${live(this._value)}
      @change=${this.onChange}
    >
      ${this._options.map(
        (o) => html`<sc-base-option value=${o.value} label=${o.label}></sc-base-option>`,
      )}
    </sc-base-select>`;
  }
}
