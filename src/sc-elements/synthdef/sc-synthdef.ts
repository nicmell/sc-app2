// <sc-synthdef> — declares a synth graph (sc-control + sc-ugen children),
// compiled to SCgf bytes at parse time (a graph error is an ordinary parse
// failure) and sent to scsynth in the load pass.

import { property } from "lit/decorators.js";
import { ADDR_SYNCED, dFree, dRecv, encode, sync, Synced } from "@sc-app/server-commands";
import { ELEMENTS } from "@/constants/sc-elements";
import { compileSynthDef } from "@/lib/synthdef/compileSynthDef";
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
  /** The compiled SCgf bytes (parse time); /d_recv'd in the load pass. */
  bytes!: Uint8Array;

  validate(): void {
    requireProp(this, "name", this.name);
  }

  protected resolveRuntime(ctx: RuntimeContext): SynthDefRuntime {
    this.processChildren(ctx);
    // Collect params + per-ugen input specs (DOM order — the bind-order
    // constraint makes that a valid build order) and compile right here: a
    // graph error fails the plugin parse like any validation error.
    const params = collectControlParams(this as ScElement as ScParentElement);
    const specs = this._scChildren!
      .filter((c): c is ScUgen => typeOf(c) === ELEMENTS.SC_UGEN)
      .map((c) => ({ name: c.name, type: c.ugen, rate: c.rate, op: c.op, inputs: collectUgenInputs(c) }));
    const bytes = compileSynthDef(this.name, params, specs);
    return { ...baseRuntime(ctx), loaded: false, bytes };
  }

  /** Send the compiled def and await its arrival: /d_recv carries an
   *  embedded /sync completion, so the /synced ack (matched by a syncId
   *  unique across WS clients — it comes from the session's node-id block)
   *  guarantees the def exists before any later sibling's /s_new. */
  async load(): Promise<void> {
    if (!this.isConnected || this.loaded) return;
    const syncId = oscClient.nextNodeId();
    const reply = oscClient.once(ADDR_SYNCED, (m) => Synced.syncId(m) === syncId);
    oscClient.send(dRecv(this.bytes, encode(sync(syncId))));
    await reply;
    this.loaded = true;
  }

  /** Free the def on unmount — defs otherwise leak in scsynth. Known
   *  limitation (old-app parity): def names are global to scsynth, so two
   *  plugins declaring the same name overwrite each other and this dFree
   *  can break the survivor. */
  unload(): void {
    if (this.loaded) oscClient.send(dFree(this.name));
    this.loaded = false;
  }
}
