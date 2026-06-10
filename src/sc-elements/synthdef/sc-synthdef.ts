// <sc-synthdef> — declares a synth graph (sc-control + sc-ugen children).
// Compilation + /d_recv arrive with the synthdef migration step.

import { property } from "lit/decorators.js";
import type { ScSynthDefItem, ScSynthDefProps } from "@/types/parsers";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScSynthDef extends ScElement<ScSynthDefItem> implements ScSynthDefProps {
  @property() accessor name = "";

  validate(): void {
    this.requireProp("name", this.name);
  }
}
