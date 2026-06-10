// <sc-select> — a dropdown over its sc-option children, bound to a
// control/var. Stub: the combobox UI + value dispatch arrive with the inputs
// migration step.

import { property } from "lit/decorators.js";
import type { ScSelectItem, ScSelectProps } from "@/types/parsers";
import { ScElement } from "./internal/sc-element";

export class ScSelect extends ScElement<ScSelectItem> implements ScSelectProps {
  @property() accessor bind = "";

  validate(): void {
    this.requireProp("bind", this.bind);
  }
}
