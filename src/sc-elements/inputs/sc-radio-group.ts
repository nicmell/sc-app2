// <sc-radio-group> — a radio set over its sc-radio children, bound to a
// control/var. Stub: the radio UI + value dispatch arrive with the inputs
// migration step.

import { property } from "lit/decorators.js";
import type { ScRadioGroupItem, ScRadioGroupProps } from "@/types/parsers";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScRadioGroup extends ScElement<ScRadioGroupItem> implements ScRadioGroupProps {
  @property() accessor bind = "";
  @property() accessor orientation: "horizontal" | "vertical" = "horizontal";

  validate(): void {
    this.requireProp("bind", this.bind);
    if (this.orientation !== "horizontal" && this.orientation !== "vertical") {
      this.failValidation(`"orientation" attribute must be horizontal|vertical (got "${this.orientation}")`);
    }
  }
}
