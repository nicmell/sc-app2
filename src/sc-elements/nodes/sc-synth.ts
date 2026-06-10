// <sc-synth> — a synth instance of an sc-synthdef (referenced by `bind`),
// with sc-control children as its parameters. /s_new in the plugin group
// arrives with the synth migration step.

import { property } from "lit/decorators.js";
import { isSynthDefRuntime } from "@/lib/utils/guards";
import type { NodeRuntime, RuntimeContext, ScSynthProps } from "@/types/runtime";
import { requireProp, resolveNode } from "@/sc-elements/internal/validation";
import { ScNode } from "@/sc-elements/internal/sc-node";

export class ScSynth extends ScNode implements ScSynthProps {
  @property() accessor name = "";
  @property() accessor bind = "";

  validate(): void {
    requireProp(this, "name", this.name);
  }

  protected resolveRuntime(ctx: RuntimeContext): NodeRuntime {
    if (this.bind) {
      const target = resolveNode(this, ctx, [this.bind]);
      // The bind must name an actual synthdef — any other named element
      // (a group, another synth) is the same error.
      if (!target || !isSynthDefRuntime(target)) {
        throw new Error(`<sc-synth bind="${this.bind}">: does not match any <sc-synthdef>`);
      }
    }
    return super.resolveRuntime(ctx);
  }
}
