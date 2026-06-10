// <sc-synthdef> — declares a synth graph (sc-control + sc-ugen children).
// Compilation + /d_recv arrive with the synthdef migration step.

import { property } from "lit/decorators.js";
import { ELEMENTS } from "@/constants/sc-elements";
import { isControlRuntime, typeOf } from "@/lib/utils/guards";
import type { RuntimeContext, ScSynthDefProps, SynthDefRuntime } from "@/types/runtime";
import { ScElement, type ScParentElement } from "@/sc-elements/internal/sc-element";
import type { ScUgen } from "@/sc-elements/synthdef/sc-ugen";

function collectControlParams(node: ScParentElement): Record<string, number> {
  const controls: Record<string, number> = {};
  for (const child of node._scChildren) {
    if (isControlRuntime(child) && child.value != null) {
      controls[child.name] = child.value;
    }
  }
  return controls;
}

function collectUgenInputs(node: ScUgen): Record<string, string> {
  const inputs: Record<string, string> = {};
  for (const child of node._scChildren!) {
    if (isControlRuntime(child)) {
      const { name, bind, value } = child;
      if (!bind && value == null) {
        throw new Error(`<sc-control name="${name}">: requires either a bind or value attribute`);
      }
      inputs[name] = bind ?? String(value);
    }
  }
  return inputs;
}

export class ScSynthDef extends ScElement implements ScSynthDefProps {
  @property() accessor name = "";

  loaded = false;

  validate(): void {
    this.requireProp("name", this.name);
  }

  protected resolveRuntime(ctx: RuntimeContext): SynthDefRuntime {
    this.processChildren(ctx);
    // Collect params + per-ugen input specs as the old app did — compilation
    // (synthDefManager) returns with the lib/synthdef migration step, deriving
    // the synthdef list from the parsed tree in document order; collecting
    // still validates that every ugen input has a bind or value.
    collectControlParams(this as ScElement as ScParentElement);
    const ugenChildren = this._scChildren!.filter((c): c is ScUgen => typeOf(c) === ELEMENTS.SC_UGEN);
    for (const c of ugenChildren) {
      collectUgenInputs(c);
    }
    return { ...this.baseRuntime(ctx), loaded: false };
  }
}
