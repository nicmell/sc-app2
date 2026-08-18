// Base for the declarative choice inputs (sc-select / sc-radio-group). The
// concrete elements keep their own tags and specs; this base owns collection
// of the corresponding pure-data option children, selection sync, the
// change-to-commit seam, and projection into the ui-components primitives.

import { html, literal } from "lit/static-html.js";
import { state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import type { StateValue } from "@/types/runtime";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import { ScInput } from "@/sc-elements/internal/sc-input";

const BASE_TAGS = {
  select: literal`sc-base-select`,
  radioGroup: literal`sc-base-radio-group`,
} as const;

const OPTION_TAGS = {
  option: literal`sc-base-option`,
  radio: literal`sc-base-radio`,
} as const;

const OPTION_NAMES = {
  option: "sc-option",
  radio: "sc-radio",
} as const;

type ChoiceBaseTag = keyof typeof BASE_TAGS;
type ChoiceOptionTag = keyof typeof OPTION_TAGS;

/** Shared implementation for inputs made from declarative choice children. */
export abstract class ScChoiceInput extends ScInput {
  /** The concrete element selects its ui-components base widget. */
  protected abstract get baseTag(): ChoiceBaseTag;
  /** The concrete element selects which pure-data child elements it collects. */
  protected abstract get optionTag(): ChoiceOptionTag;

  /** The select-only forwarded prop. */
  protected get choicePlaceholder(): string | undefined {
    return undefined;
  }

  /** The radio-group-only forwarded prop. */
  protected get choiceOrientation(): string | undefined {
    return undefined;
  }

  /** The radio-group-only forwarded prop. */
  protected get choiceLabel(): string | undefined {
    return undefined;
  }

  @state() accessor _value = 0;

  /** The declarative choices — read lazily from the authored DOM children:
   *  these inputs are transparent containers, so their option children belong
   *  to the ENCLOSING node's runtime tree (`_parentScNode` walks through
   *  transparency) — the DOM is the one place they stay this element's.
   *  Lit's first update runs after the synchronous parse, so render always
   *  sees them upgraded. */
  get _options(): Array<{ value: number; label: string }> {
    const optionName = OPTION_NAMES[this.optionTag];
    return Array.from(this.children)
      .filter((c): c is ScElement => c.tagName.toLowerCase() === optionName)
      .map((o) => ({ value: o.getProp("value") as number, label: o.getProp("label") as string }));
  }

  protected syncFromState(value: StateValue | undefined): void {
    const n = this.numericState(value);
    if (n !== undefined) this._value = n;
  }

  protected onChange = (e: Event): void => {
    this.commit((e.target as unknown as { value: number }).value);
  };

  render() {
    const baseTag = BASE_TAGS[this.baseTag];
    const optionTag = OPTION_TAGS[this.optionTag];
    // `baseTag` and `optionTag` come from fixed tables; neither is user input.
    /* eslint-disable lit/binding-positions, lit/no-invalid-html */
    return html`<${baseTag}
      placeholder=${ifDefined(this.choicePlaceholder)}
      orientation=${ifDefined(this.choiceOrientation)}
      label=${ifDefined(this.choiceLabel)}
      size=${ifDefined(this.getProp("size"))}
      ?disabled=${this.getProp("disabled")}
      .value=${live(this._value)}
      @change=${this.onChange}
    >
      ${this._options.map(
        (o) => html`<${optionTag} value=${o.value} label=${o.label}></${optionTag}>`,
      )}
    </${baseTag}>`;
    /* eslint-enable lit/binding-positions, lit/no-invalid-html */
  }
}
