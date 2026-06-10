// <sc-control> — a named parameter: a literal `value` or a `bind` reference
// (mutually exclusive). The attributes live here as reactive properties; the
// runtime reads them through the item's `_element`. /n_set propagation arrives
// with the controls migration step.

import { property } from "lit/decorators.js";
import type { ScControlRuntime, ScControlProps } from "@/types/parsers";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScControl extends ScElement<ScControlRuntime> implements ScControlProps {
  @property() accessor name = "";
  @property() accessor bind: string | undefined = undefined;
  @property({ type: Number }) accessor value: number | undefined = undefined;

  validate(): void {
    this.requireProp("name", this.name);
    if (this.bind !== undefined && this.value !== undefined) {
      this.failValidation(`"value" and "bind" are mutually exclusive`);
    }
    this.requireNumeric("value", this.value);
  }
}
