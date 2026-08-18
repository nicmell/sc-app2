// Base for the numeric writing inputs (sc-slider / sc-knob). The concrete
// elements keep their own tags and specs; this base only owns the shared
// reactive value, state sync, input-to-commit seam, and widget forwarding.

import { html, literal } from "lit/static-html.js";
import { state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import type { StateValue } from "@/types/runtime";
import { ScInput } from "@/sc-elements/internal/sc-input";

const BASE_TAGS = {
  slider: literal`sc-base-slider`,
  knob: literal`sc-base-knob`,
} as const;

type NumericBaseTag = keyof typeof BASE_TAGS;

/** Shared implementation for range-like numeric inputs. */
export abstract class ScNumericInput extends ScInput {
  /** The concrete element selects its ui-components base widget. */
  protected abstract get baseTag(): NumericBaseTag;

  /** Only sc-slider forwards an orientation; sc-knob has no such prop. */
  protected get widgetOrientation(): string | undefined {
    return undefined;
  }

  /** Genuinely reactive widget-facing value: seeded by the load pass (bound
   *  recompute or the static `value` attribute) and bound through `live()`.
   *  Internal — the attributes are read via `getProp` like everywhere else. */
  @state() accessor _value = 0;

  protected syncFromState(value: StateValue | undefined): void {
    const n = this.numericState(value);
    if (n !== undefined) this._value = n;
  }

  protected onInput = (e: Event): void => {
    this.commit((e.target as unknown as { value: number }).value);
  };

  render() {
    const tag = BASE_TAGS[this.baseTag];
    // `tag` comes from the fixed BASE_TAGS table; it is not raw user input.
    /* eslint-disable lit/binding-positions, lit/no-invalid-html */
    return html`<${tag}
      min=${ifDefined(this.getProp("min"))}
      max=${ifDefined(this.getProp("max"))}
      step=${ifDefined(this.getProp("step"))}
      label=${ifDefined(this.getProp("label"))}
      size=${ifDefined(this.getProp("size"))}
      orientation=${ifDefined(this.widgetOrientation)}
      ?disabled=${this.getProp("disabled")}
      .value=${live(this._value)}
      @input=${this.onInput}
    ></${tag}>`;
    /* eslint-enable lit/binding-positions, lit/no-invalid-html */
  }
}
