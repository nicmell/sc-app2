// Base for the WRITING bind-targeting inputs (sc-range / sc-knob /
// sc-checkbox / sc-select / sc-radio-group / sc-run): the `bind` attribute
// plus the resolved `_targetScNode` runtime reference — a single writable
// target (an expression is not writable; the read-only visuals live on
// internal/sc-derived instead). The default runtime resolves the visual bind
// to a state element; subclasses override it where they parse children first
// (select/radio-group) or target a node instead (sc-run). Each subclass keeps
// its own validate() — bind is not required everywhere (sc-range, sc-run).
//
// It ALSO owns the shared value seam every value-input reuses (folded up from
// the per-element copies): one subscription to the target's live `_state` over
// the load/unload/disconnect lifecycle, `syncFromState()` as the subclass hook
// that maps the value onto the widget, and `commit()` as the write path —
// setValue() then a re-read snap-back so a gesture on BOUND (derived,
// read-only) state reverts. Inputs without a value widget (the select/radio
// stubs, sc-run's node target) leave syncFromState a no-op.

import { property } from "lit/decorators.js";
import { isStateRuntime } from "@/lib/utils/guards";
import type { InputRuntime, RuntimeContext } from "@/types/runtime";
import { resolveVisualBind } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

export abstract class ScInput extends ScElement {
  @property() accessor bind = "";

  /** The live bound target (a state element; a node for sc-run). */
  _targetScNode?: ScElement;

  /** The target-value subscription (set in load, cleared on unload/disconnect). */
  #off?: () => void;

  protected resolveRuntime(ctx: RuntimeContext): InputRuntime {
    return resolveVisualBind(this, ctx, this.bind);
  }

  /** Map the target's live value onto this input's widget-facing state.
   *  Called once on load (statechange is change-only) and on every target
   *  statechange. `undefined` = the target has no value yet — leave the
   *  widget as-is. Default no-op: inputs with no value widget (stubs; sc-run)
   *  don't sync. */
  protected syncFromState(_value: number | undefined): void {}

  async load(): Promise<void> {
    this.#off?.(); // re-entrant: drop the stale subscription on reload
    this.#off = undefined;
    const target = this._targetScNode;
    if (target && isStateRuntime(target) && target.enabled) {
      this.syncFromState(target._state); // sync once — statechange won't fire for the current value
      this.#off = target.onStateChange((next) => this.syncFromState(next));
    }
    await super.load();
  }

  unload(): void {
    super.unload();
    this.#off?.();
    this.#off = undefined;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#off?.();
    this.#off = undefined;
  }

  /** The write path: dispatch to the target, then re-read and re-sync. A write
   *  to BOUND (derived, read-only) state is inert, so the re-read snaps the
   *  widget back to the real value; for a literal target the synchronous
   *  statechange echo has already synced (a no-op). The gesture moved the
   *  widget DOM, not the reactive prop, so syncFromState usually reassigns an
   *  UNCHANGED value — Lit would skip the render and `live()` would never run;
   *  force the update so the snap-back reaches the inner control. */
  protected commit(value: number): void {
    const target = this._targetScNode;
    if (!target || !isStateRuntime(target)) return;
    target.setValue(value);
    this.syncFromState(target._state ?? value);
    this.requestUpdate();
  }
}
