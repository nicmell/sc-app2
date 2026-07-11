// <sc-synthdef> — declares a synth graph (sc-control + sc-ugen children).
// The parse collects the param defaults and the DOM-ordered ugen specs onto
// the element; the load pass compiles them to SCgf right at /d_recv time and
// awaits the install ack.

import { ELEMENTS } from "@/constants/sc-elements";
import { compileSynthDef, type UgenSpec } from "@/lib/synthdef/compileSynthDef";
import { oscClient } from "@/stores/osc";
import { isControlRuntime, typeOf } from "@/lib/utils/guards";
import type { RuntimeContext, SynthDefRuntime } from "@/types/runtime";
import { baseRuntime, requireName } from "@/sc-elements/internal/validation";
import { ScElement, type ScParentElement } from "@/sc-elements/internal/sc-element";
import type { ScEnv } from "@/sc-elements/synthdef/sc-env";
import type { ScUgen } from "@/sc-elements/synthdef/sc-ugen";

function collectControlParams(node: ScParentElement): Record<string, number> {
  const controls: Record<string, number> = {};
  for (const child of node._scChildren) {
    if (isControlRuntime(child)) {
      const value = child.getProp("value") as number | undefined;
      if (value != null) controls[child.getProp("name") as string] = value;
    }
  }
  return controls;
}

function collectUgenInputs(node: ScUgen): Record<string, string> {
  const inputs: Record<string, string> = {};
  for (const child of node._scChildren!) {
    if (isControlRuntime(child)) {
      const name = child.getProp("name") as string;
      // The graph-input REFERENCE (`bind:value="lfo"`, `"a, b"`, `"osc:1"`) —
      // the same spelling as a state expression, consumed raw here (never
      // resolved on the state graph; resolveRuntimeProps skips ugen children).
      // Empty references count as absent — the old parse-time error beats a
      // junk "" reaching the compiler at /d_recv time.
      const bind = child.getAttribute("bind:value");
      const value = child.getProp("value") as number | undefined;
      if (!bind && value == null) {
        throw new Error(
          `<sc-control name="${name}">: requires either a value or bind:value attribute`,
        );
      }
      inputs[name] = bind || String(value);
    }
  }
  return inputs;
}

export class ScSynthDef extends ScElement {
  loaded = false;
  /** The param defaults + DOM-ordered ugen specs, collected at parse —
   *  compiled to SCgf at /d_recv time in the load pass. */
  params!: Record<string, number>;
  specs!: UgenSpec[];

  validate(): void {
    requireName(this);
  }

  protected resolveRuntime(ctx: RuntimeContext): SynthDefRuntime {
    this.processChildren(ctx);
    // Collect params + per-ugen input specs (DOM order — the bind-order
    // constraint makes that a valid build order); collecting validates that
    // every ugen input has a bind or value. Compilation waits for load.
    const params = collectControlParams(this as ScElement as ScParentElement);
    const specs = this._scChildren!.filter((c): c is ScUgen => typeOf(c) === ELEMENTS.SC_UGEN).map(
      (c) => {
        const env = c._scChildren?.find((ch): ch is ScEnv => typeOf(ch) === ELEMENTS.SC_ENV);
        return {
          name: c.getProp("name") as string,
          type: c.getProp("type") as string,
          rate: (c.getProp("rate") as string) ?? "ar",
          op: c.getProp("op") as string | undefined,
          inputs: collectUgenInputs(c),
          env: env?.toEnvSpec(),
        };
      },
    );
    return { ...baseRuntime(ctx), loaded: false, params, specs };
  }

  /** Compile the collected specs and install the def: the /d_recv's
   *  embedded /sync completion guarantees it exists in scsynth before any
   *  later sibling's /s_new. A graph error fails the load like any other
   *  pipeline failure (surfaced in the plugin's error box). */
  async load(): Promise<void> {
    if (!this.isConnected || this.loaded) return;
    const epoch = this._rootScNode?.loadEpoch ?? 0;
    await oscClient.sendSynthDef(
      compileSynthDef(this.getProp("name") as string, this.params, this.specs),
    );
    if (!this.isConnected || (this._rootScNode?.loadEpoch ?? 0) !== epoch) return;
    this.loaded = true;
  }

  /** Free the def on unmount — defs otherwise leak in scsynth. Known
   *  limitation (old-app parity): def names are global to scsynth, so two
   *  plugins declaring the same name overwrite each other and this d_free
   *  can break the survivor. */
  unload(): void {
    if (this.loaded) oscClient.freeSynthDef(this.getProp("name") as string);
    this.loaded = false;
  }
}
