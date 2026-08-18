// <sc-control> — a named parameter: a literal `value` or a `bind:value`
// expression (mutually exclusive; the store seam and the statechange
// propagation live on the ScState/ScElement bases). Enabled when the parent
// is a node (plugin/group/synth); a pure graph input inside ugens — where
// the SAME spelling means a graph-input REFERENCE (`bind:value="lfo"`) the
// synthdef collectors consume raw.
//
// The only control-specific behavior is the OSC side of a value change,
// /n_set on the owning node when it is live, fired from exactly two places:
//   - the WRITE path (`dispatchValue`, user gestures via setValue) — the
//     store echo runs first, so a statechange from an EXTERNAL store write
//     stays UI-only (no echo: two inputs bound to one control converge
//     through the shared key with exactly one /n_set per gesture);
//   - the `runtimeValueChanged` hook for DERIVED controls only — a recompute
//     is not a store write, so the hook is where its /n_set lives (literal
//     controls no-op here, or external writes would echo OSC).
// Values are coerced at this boundary: scsynth controls are floats, so a
// string-valued expression skips the /n_set with a console warning (the UI
// state still updates).

import { ELEMENTS } from "@/constants/sc-elements";
import { isNodeRuntime, typeOf } from "@/lib/utils/guards";
import { oscClient } from "@/stores/osc";
import type { StateValue } from "@/types/runtime";
import { failValidation } from "@/sc-elements/internal/validation";
import { bindAttr } from "@/sc-elements/internal/xsd/types";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScControl extends ScState {
  validate(): void {
    super.validate();
    // The vector coercion admits strings (sc-var's string values) — a
    // control is numeric: scalar or comma-list array (the old decimal gate,
    // array-aware).
    const value = this.getProp("value");
    if (typeof value === "string") {
      failValidation(
        this,
        `"value" attribute must be a number or a comma-list of numbers (got "${value}")`,
      );
    }
    // A `bind:value` on a DISABLED control splits by position: inside an
    // sc-ugen it is a graph-input REFERENCE (consumed raw by the synthdef
    // collectors — resolveRuntimeProps skips it); on a direct synthdef param
    // it would be silently dropped from the def — reject loudly.
    if (
      !this.enabled &&
      this.hasAttribute(bindAttr("value")) &&
      (!this._parentScNode || typeOf(this._parentScNode) !== ELEMENTS.SC_UGEN)
    ) {
      failValidation(this, `"${bindAttr("value")}" is not allowed on a synthdef param`);
    }
  }

  /** /n_set (scalar) or /n_setn (array) on the owning node — only when it is
   *  live (the load-pass initial lands before the parent's /s_new and rides
   *  it via getControls / the array seed instead; the ack-window catch-up in
   *  ScSynth.load covers the send→/n_go gap). `_parentScNode` IS the nearest
   *  non-transparent ancestor: a control wrapped in an sc-if under a group
   *  still writes the group's node — and a GROUP-level array write fans to
   *  every synth inside that carries the named control array. */
  private sendControl(next: StateValue): void {
    const parent = this._parentScNode;
    if (!(parent && isNodeRuntime(parent) && parent.loaded && parent.nodeId !== 0)) return;
    const name = this.getProp("name") as string;
    if (Array.isArray(next)) {
      if (next.some((v) => Number.isNaN(Number(v)))) {
        console.warn(`<sc-control name="${name}">: non-numeric array element — /n_setn skipped`);
        return;
      }
      oscClient.setControln(parent.nodeId, name, next.map(Number));
      return;
    }
    const value = Number(next);
    if (Number.isNaN(value)) {
      console.warn(
        `<sc-control name="${name}">: non-numeric value ${JSON.stringify(next)} — /n_set skipped`,
      );
      return;
    }
    oscClient.setControl(parent.nodeId, name, value);
  }

  /** The user-gesture write path: store write + /n_set. */
  protected dispatchValue(next: StateValue): boolean {
    if (!super.dispatchValue(next)) return false;
    this.sendControl(next);
    return true;
  }

  /** A DERIVED control's recompute must /n_set too — there is no store write
   *  to carry it. Literal controls no-op (their /n_set is dispatchValue's). */
  protected runtimeValueChanged(name: string, _prev: StateValue | undefined, next: StateValue) {
    if (name === "value" && this.derived) this.sendControl(next);
  }
}
