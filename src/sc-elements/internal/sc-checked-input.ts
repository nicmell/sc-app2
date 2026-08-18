// Base for the checked writing inputs (sc-checkbox / sc-switch). The concrete
// elements keep their own tags and specs; this base owns the shared 1/0 value
// mapping, change-to-commit seam, and widget forwarding.

import { html, literal } from "lit/static-html.js";
import { state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import type { StateValue } from "@/types/runtime";
import { ScInput } from "@/sc-elements/internal/sc-input";

const BASE_TAGS = {
  checkbox: literal`sc-base-checkbox`,
  switch: literal`sc-base-switch`,
} as const;

type CheckedBaseTag = keyof typeof BASE_TAGS;

/** Shared implementation for boolean-looking checked inputs. */
export abstract class ScCheckedInput extends ScInput {
  /** The concrete element selects its ui-components base widget. */
  protected abstract get baseTag(): CheckedBaseTag;

  /** Only sc-checkbox forwards a label; sc-switch has none. */
  protected get widgetLabel(): string | undefined {
    return undefined;
  }

  @state() accessor _checked = false;

  protected syncFromState(value: StateValue | undefined): void {
    const n = this.numericState(value);
    if (n !== undefined) this._checked = n !== 0;
  }

  protected onChange = (e: Event): void => {
    this.commit((e.target as unknown as { checked: boolean }).checked ? 1 : 0);
  };

  render() {
    const tag = BASE_TAGS[this.baseTag];
    // `tag` comes from the fixed BASE_TAGS table; it is not raw user input.
    /* eslint-disable lit/binding-positions, lit/no-invalid-html */
    return html`<${tag}
      label=${ifDefined(this.widgetLabel)}
      size=${ifDefined(this.getProp("size"))}
      ?disabled=${this.getProp("disabled")}
      .checked=${live(this._checked)}
      @change=${this.onChange}
    ></${tag}>`;
    /* eslint-enable lit/binding-positions, lit/no-invalid-html */
  }
}
