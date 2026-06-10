// <sc-radio> — one declarative choice inside an sc-radio-group. Stub: the
// indicator UI arrives with the inputs migration step. Presentational
// attributes (width/height/src/colors) are XSD-allowed but not declared yet.

import { property } from "lit/decorators.js";
import type { ScRadioRuntime, ScRadioProps } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScRadio extends ScElement<ScRadioRuntime> implements ScRadioProps {
  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";

  validate(): void {
    this.requireNumeric("value", this.value);
  }
}
