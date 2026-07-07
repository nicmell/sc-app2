// <sc-radio-group> — a radio set over its sc-radio children, bound to a
// control/var (`bind`/`_targetScNode` on the ScInput base). Renders the
// ui-components <sc-base-radio-group>, projecting each sc-radio's collected
// {value,label} into an <sc-base-radio>. The sc-radio children are pure data
// (consumed at parse, never enabled); the shared ScInput seam syncs the
// selection from the target's `_state` and dispatches the chosen value.

import { html } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import type { ScSize, ScRadioGroupBase } from "@sc-app/ui-components/lit";
import { failValidation, requireProp } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";
import type { ScRadio } from "@/sc-elements/inputs/sc-radio";
import "@sc-app/ui-components/lit";

export class ScRadioGroup extends ScInput {
  @property() accessor orientation: "horizontal" | "vertical" = "horizontal";
  @property() accessor label = "";
  @property() accessor size: ScSize = "md";
  @property({ type: Boolean }) accessor disabled = false;

  @state() accessor _value = 0;

  validate(): void {
    requireProp(this, "bind", this.bind);
    if (this.orientation !== "horizontal" && this.orientation !== "vertical") {
      // The prop is typed as the valid union, so TS narrows this branch to
      // `never`; the attribute is arbitrary at runtime, so stringify it.
      failValidation(
        this,
        `"orientation" attribute must be horizontal|vertical (got "${String(this.orientation)}")`,
      );
    }
  }

  /** The declarative choices — read lazily from the parsed children: the
   *  radio-group is a transparent container, so its sc-radio children are
   *  processed by the ENCLOSING level (after this element) and attach here
   *  as their parse parent. Lit's first update runs after the synchronous
   *  parse, so render always sees them. */
  get _options(): Array<{ value: number; label: string }> {
    return (this._scChildren ?? [])
      .filter((c): c is ScRadio => c.tagName.toLowerCase() === "sc-radio")
      .map((r) => ({ value: r.value, label: r.label }));
  }

  protected syncFromState(value: number | undefined): void {
    if (value !== undefined) this._value = value;
  }

  private onChange = (e: Event) => {
    this.commit((e.target as ScRadioGroupBase).value);
  };

  render() {
    return html`<sc-base-radio-group
      orientation=${this.orientation}
      label=${this.label}
      size=${this.size}
      ?disabled=${this.disabled}
      .value=${live(this._value)}
      @change=${this.onChange}
    >
      ${this._options.map(
        (o) => html`<sc-base-radio value=${o.value} label=${o.label}></sc-base-radio>`,
      )}
    </sc-base-radio-group>`;
  }
}
