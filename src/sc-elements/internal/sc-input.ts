// Base for the WRITING bind-targeting inputs (sc-slider / sc-knob /
// sc-checkbox / sc-select / sc-radio-group / sc-button / sc-run): the `bind`
// attribute plus the resolved `_targetScNode` runtime reference — a single
// writable target, NON-reactive by design (an expression is not writable;
// the read-only visuals evaluate runtime props on the ScElement base
// instead). The default runtime resolves the visual bind to a state element;
// subclasses override it where they target a node instead (sc-run). Each
// subclass keeps its own validate() — bind is not required everywhere
// (sc-slider, sc-run).
//
// It ALSO owns the shared value seam every value-input reuses (folded up from
// the per-element copies): one subscription to the target's live `_state` over
// the load/unload/disconnect lifecycle (parked on the base's shared
// subscription bookkeeping), `syncFromState()` as the subclass hook that maps
// the value onto the widget, and `commit()` as the write path — setValue()
// then a re-read snap-back so a gesture on DERIVED (read-only) state reverts.
// Inputs without a value widget (sc-run's node target) leave syncFromState a
// no-op. State values may be strings now — the numeric widgets coerce in
// their syncFromState and skip NaN.

import { isStateRuntime } from "@/lib/utils/guards";
import type { InputRuntime, RuntimeContext, StateValue } from "@/types/runtime";
import { resolveVisualBind } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

export abstract class ScInput extends ScElement {
  /** The live bound target (a state element; a node for sc-run). */
  _targetScNode?: ScElement;

  protected resolveRuntime(ctx: RuntimeContext): InputRuntime {
    return resolveVisualBind(this, ctx, (this.getProp("bind") ?? "") as string);
  }

  /** A state value as a widget number — undefined (leave the widget as-is)
   *  when the target is unset or holds a non-numeric string: the base
   *  widgets' Number props must not receive strings. */
  protected numericState(value: StateValue | undefined): number | undefined {
    if (value === undefined) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }

  /** Map the target's live value onto this input's widget-facing state.
   *  Called once on load (statechange is change-only) and on every target
   *  statechange. `undefined` = the target has no value yet — leave the
   *  widget as-is. Default no-op: inputs with no value widget (sc-run)
   *  don't sync. */
  protected syncFromState(_value: StateValue | undefined): void {}

  async load(): Promise<void> {
    // super.load()'s synchronous prefix drops the stale subscriptions FIRST
    // (re-entrant reload) — nothing awaits before the wiring below registers
    // (option children are pure data), so no write can slip the gap.
    const loading = super.load();
    const target = this._targetScNode;
    if (target && isStateRuntime(target) && target.enabled) {
      this.syncFromState(target._state); // sync once — statechange won't fire for the current value
      this.addRuntimeSubscription(target.onStateChange((next) => this.syncFromState(next)));
    }
    await loading;
  }

  /** The write path: dispatch to the target, then re-read and re-sync. A write
   *  to DERIVED (read-only) state is inert, so the re-read snaps the widget
   *  back to the real value; for a literal target the synchronous statechange
   *  echo has already synced (a no-op). The gesture moved the widget DOM, not
   *  the reactive prop, so syncFromState usually reassigns an UNCHANGED value
   *  — Lit would skip the render and `live()` would never run; force the
   *  update so the snap-back reaches the inner control. */
  protected commit(value: StateValue): void {
    const target = this._targetScNode;
    if (!target || !isStateRuntime(target)) return;
    target.setValue(value);
    this.syncFromState(target._state ?? value);
    this.requestUpdate();
  }
}
