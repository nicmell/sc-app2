// <sc-synthdef> — declares a synth graph (sc-control + sc-ugen children).
// Compilation + /d_recv arrive with the synthdef migration step.

import { property } from "lit/decorators.js";
import { ELEMENTS } from "@/constants/sc-elements";
import { isControlRuntime, typeOf } from "@/lib/utils/guards";
import type { RuntimeContext, ScElementRuntimeBase, ScParentRuntime, ScSynthDefRuntime, ScSynthDefProps, ScUgenRuntime, SynthDefRuntime } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

function collectControlParams(node: ScParentRuntime): Record<string, number> {
  const controls: Record<string, number> = {};
  for (const child of node.children) {
    if (isControlRuntime(child) && child._element.value != null) {
      controls[child._element.name] = child._element.value;
    }
  }
  return controls;
}

function collectUgenInputs(node: ScUgenRuntime): Record<string, string> {
  const inputs: Record<string, string> = {};
  for (const child of node.children) {
    if (isControlRuntime(child)) {
      const { name, bind, value } = child._element;
      if (!bind && value == null) {
        throw new Error(`<sc-control name="${name}">: requires either a bind or value attribute`);
      }
      inputs[name] = bind ?? String(value);
    }
  }
  return inputs;
}

export class ScSynthDef extends ScElement<ScSynthDefRuntime> implements ScSynthDefProps {
  @property() accessor name = "";

  validate(): void {
    this.requireProp("name", this.name);
  }

  protected resolveRuntime(item: ScElementRuntimeBase, ctx: RuntimeContext): SynthDefRuntime {
    this.processChildren(item, ctx);
    const n = item as ScSynthDefRuntime;
    // Collect params + per-ugen input specs as the old app did — compilation
    // (synthDefManager) returns with the lib/synthdef migration step, deriving
    // the synthdef list from the parsed tree in document order; collecting
    // still validates that every ugen input has a bind or value.
    collectControlParams(n);
    const ugenChildren = n.children.filter((c): c is ScUgenRuntime => typeOf(c) === ELEMENTS.SC_UGEN);
    for (const c of ugenChildren) {
      collectUgenInputs(c);
    }
    return { ...this.baseRuntime(ctx), loaded: false };
  }
}
