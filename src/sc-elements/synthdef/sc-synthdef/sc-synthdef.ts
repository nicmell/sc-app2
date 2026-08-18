// <sc-synthdef> — declares a synth graph (sc-control + sc-ugen children).
// The parse collects the param defaults and the DOM-ordered ugen specs onto
// the element; the load pass compiles them to SCgf right at /d_recv time and
// awaits the install ack.

import { ELEMENTS } from "@/constants/sc-elements";
import { compileSynthDef, type UgenSpec } from "@/lib/synthdef/compileSynthDef";
import { oscClient } from "@/stores/osc";
import { isControlRuntime, typeOf } from "@/lib/utils/guards";
import type { RuntimeContext, SynthDefRuntime } from "@/types/runtime";
import { baseRuntime, failValidation } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";
import type { ScUgen } from "@/sc-elements/synthdef/sc-ugen";

/** Param defaults: a scalar per param, or a numeric ARRAY (a comma-list
 *  value — compiled as a control array, sclang's `\name.kr([...])`). */
function collectControlParams(children: readonly ScElement[]): Record<string, number | number[]> {
  const controls: Record<string, number | number[]> = {};
  for (const child of children) {
    if (isControlRuntime(child)) {
      const value = child.getProp("value") as number | number[] | undefined;
      if (value != null) controls[child.getProp("name") as string] = value;
    }
  }
  return controls;
}

/** Collect an element's <sc-control> children into name → ref-or-literal
 *  strings — the shape consumed by the synthdef graph compiler. The
 *  graph-input REFERENCE (`bind:value="lfo"`, `"a, b"`, `"osc.1"`) is read raw
 *  (never resolved on the state graph; resolveRuntimeProps skips these
 *  children); an empty reference counts as absent — the parse-time error beats
 *  a junk "" reaching the compiler at /d_recv time. */
function collectControlEntries(children: readonly ScElement[]): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const child of children) {
    if (!isControlRuntime(child)) continue;
    const name = child.getProp("name") as string;
    const bind = child.getAttribute("bind:value");
    const value = child.getProp("value") as number | number[] | undefined;
    if (!bind && value == null) {
      throw new Error(
        `<sc-control name="${name}">: requires either a value or bind:value attribute`,
      );
    }
    // An array value stringifies back to its comma-list — resolveSignal
    // re-parses it, so literal arrays and refs share one wire shape.
    entries[name] = bind || String(value);
  }
  return entries;
}

export class ScSynthDef extends ScElement {
  loaded = false;
  /** The param defaults + DOM-ordered ugen specs, collected at parse —
   *  compiled to SCgf at /d_recv time in the load pass. */
  params!: Record<string, number | number[]>;
  specs!: UgenSpec[];

  /** The param's base slot index in the compiled def's flat control space —
   *  params occupy consecutive slots in declaration order, arrays spanning
   *  their length (the compiler builds from this SAME object, so the layout
   *  matches by construction). Spawners address array-control slots by
   *  integer index inside /s_new. */
  paramIndexOf(name: string): number | undefined {
    let offset = 0;
    for (const [param, value] of Object.entries(this.params)) {
      if (param === name) return offset;
      offset += Array.isArray(value) ? value.length : 1;
    }
    return undefined;
  }

  protected resolveRuntime(ctx: RuntimeContext): SynthDefRuntime {
    const children = this.processChildren(ctx);
    // The synthdef PLANE is compile-time data — this class owns its rules:
    // a param (direct sc-control child) carrying a bind:value would be
    // silently dropped from the def, so reject it loudly here (ugen INPUTS
    // use the same spelling as raw graph references — collectControlEntries
    // consumes them; the plane never loads, so no runtime gates exist).
    for (const child of children) {
      if (isControlRuntime(child) && child.hasAttribute("bind:value")) {
        failValidation(child, `"bind:value" is not allowed on a synthdef param`);
      }
    }
    // Collect params + per-ugen input specs (DOM order — the bind-order
    // constraint makes that a valid build order); collecting validates that
    // every ugen input has a bind or value. Compilation waits for load.
    const params = collectControlParams(children);
    const specs = children.filter((c): c is ScUgen => typeOf(c) === ELEMENTS.SC_UGEN).map(
      (c) => ({
        name: c.getProp("name") as string,
        type: c.getProp("type") as string,
        rate: c.getProp("rate") as string,
        op: c.getProp("op") as string | undefined,
        inputs: collectControlEntries(c._scChildren ?? []),
      }),
    );
    return { ...baseRuntime(ctx), loaded: false, params, specs };
  }

  /** Compile the collected specs and install the def: the /d_recv's
   *  embedded /sync completion guarantees it exists in scsynth before any
   *  later sibling's /s_new. A graph error fails the load like any other
   *  pipeline failure (surfaced in the plugin's error box). */
  async load(): Promise<void> {
    if (!this.isConnected || this.loaded) return;
    const live = this.loadGuard();
    await oscClient.sendSynthDef(
      compileSynthDef(this.getProp("name") as string, this.params, this.specs),
    );
    if (!this.isConnected || !live()) return;
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
