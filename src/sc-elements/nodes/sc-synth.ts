// <sc-synth> — a synth instance of an sc-synthdef (referenced by `bind`),
// with sc-control children as its parameters. /s_new in the plugin group
// arrives with the synth migration step.

import { property } from "lit/decorators.js";
import type { NodeRuntime, RuntimeContext, ScSynthRuntime, ScSynthProps } from "@/types/runtime";
import { runAttribute, ScElement } from "@/sc-elements/internal/sc-element";

export class ScSynth extends ScElement<ScSynthRuntime> implements ScSynthProps {
  @property() accessor name = "";
  @property() accessor bind = "";
  @property(runAttribute) accessor run = true;

  validate(): void {
    this.requireProp("name", this.name);
  }

  protected resolveRuntime(ctx: RuntimeContext): NodeRuntime {
    if (this.bind && !this.resolveNode(ctx, [this.bind])) {
      throw new Error(`<sc-synth bind="${this.bind}">: does not match any <sc-synthdef>`);
    }
    this.processChildren(ctx);
    return this.nodeRuntime(ctx, this.run);
  }
}
