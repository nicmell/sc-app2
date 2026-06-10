// <sc-synth> — a synth instance of an sc-synthdef (referenced by `bind`),
// with sc-control children as its parameters. /s_new in the plugin group
// arrives with the synth migration step.

import { property } from "lit/decorators.js";
import type { ScSynthRuntime, ScSynthProps } from "@/types/parsers";
import { runAttribute, ScElement } from "@/sc-elements/internal/sc-element";

export class ScSynth extends ScElement<ScSynthRuntime> implements ScSynthProps {
  @property() accessor name = "";
  @property() accessor bind = "";
  @property(runAttribute) accessor run = true;

  validate(): void {
    this.requireProp("name", this.name);
  }
}
