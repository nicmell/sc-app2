// <sc-synthdef> — declares a synth graph (sc-control + sc-ugen children).
// The parse collects the param defaults and the DOM-ordered ugen specs onto
// the element; the load pass compiles them to SCgf right at /d_recv time and
// awaits the install ack.

import { property } from "lit/decorators.js";
import { ELEMENTS } from "@/constants/sc-elements";
import { compileSynthDef, type UgenSpec } from "@/lib/synthdef/compileSynthDef";
import { oscClient } from "@/stores/osc";
import { isControlRuntime, typeOf } from "@/lib/utils/guards";
import type { RuntimeContext, SynthDefRuntime } from "@/types/runtime";
import { baseRuntime, requireProp } from "@/sc-elements/internal/validation";
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

export class ScSynthDef extends ScElement {
  @property() accessor name = "";

  loaded = false;
  /** The param defaults + DOM-ordered ugen specs, collected at parse —
   *  compiled to SCgf at /d_recv time in the load pass. */
  params!: Record<string, number>;
  specs!: UgenSpec[];

  validate(): void {
    requireProp(this, "name", this.name);
  }

  protected resolveRuntime(ctx: RuntimeContext): SynthDefRuntime {
    this.processChildren(ctx);
    // Collect params + per-ugen input specs (DOM order — the bind-order
    // constraint makes that a valid build order); collecting validates that
    // every ugen input has a bind or value. Compilation waits for load.
    const params = collectControlParams(this as ScElement as ScParentElement);
    const specs = this._scChildren!.filter((c): c is ScUgen => typeOf(c) === ELEMENTS.SC_UGEN).map(
      (c) => ({ name: c.name, type: c.ugen, rate: c.rate, op: c.op, inputs: collectUgenInputs(c) }),
    );
    return { ...baseRuntime(ctx), loaded: false, params, specs };
  }

  /** Compile the collected specs and install the def: the /d_recv's
   *  embedded /sync completion guarantees it exists in scsynth before any
   *  later sibling's /s_new. A graph error fails the load like any other
   *  pipeline failure (surfaced in the plugin's error box). */
  async load(): Promise<void> {
    if (!this.isConnected || this.loaded) return;
    await oscClient.sendSynthDef(compileSynthDef(this.name, this.params, this.specs));
    this.loaded = true;
  }

  /** Free the def on unmount — defs otherwise leak in scsynth. Known
   *  limitation (old-app parity): def names are global to scsynth, so two
   *  plugins declaring the same name overwrite each other and this d_free
   *  can break the survivor. */
  unload(): void {
    if (this.loaded) oscClient.freeSynthDef(this.name);
    this.loaded = false;
  }
}
