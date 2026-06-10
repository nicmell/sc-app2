// <sc-synthdef> — declares a synth graph (sc-control + sc-ugen children).
// Compilation + /d_recv arrive with the synthdef migration step.

import { property } from "lit/decorators.js";
import type { ScSynthDefRuntime, ScSynthDefProps } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScSynthDef extends ScElement<ScSynthDefRuntime> implements ScSynthDefProps {
  @property() accessor name = "";

  validate(): void {
    this.requireProp("name", this.name);
  }
}
