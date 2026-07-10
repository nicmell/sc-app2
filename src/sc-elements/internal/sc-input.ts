// Base for the WRITING value inputs (sc-slider / sc-knob / sc-checkbox /
// sc-switch / sc-select / sc-radio-group / sc-button). Inputs bind to state exactly
// like visuals do — `bind:value="s1.freq"` resolved by the ScElement
// runtime-prop machinery — so the READ side (subscription, recompute,
// notification) is fully inherited: this base only adds
//
//   - `targetScState` — the WRITE target, derived from the resolved runtime
//     prop: a plain single-path bind resolves to exactly one target with no
//     expression, and only that shape is writable. An EXPRESSION bind makes
//     the input a read-only live meter (gestures snap back), the derived-
//     state semantics inputs already had.
//   - `syncFromState()` — the subclass hook mapping the live value onto the
//     widget, driven by the `runtimeValueChanged` hook (no extra
//     subscription) and, for a STATIC `value` attribute (a fixed inert
//     widget — it shows its Lit default until its load turn), seeded once in
//     load().
//   - `commit()` — the write path: setValue() on the target, then a re-read
//     snap-back.
//
// State values may be strings — the numeric widgets coerce in their
// syncFromState (numericState) and skip NaN.

import type { StateValue } from "@/types/runtime";
import type { ScState } from "@/sc-elements/internal/sc-state";
import { ScElement } from "@/sc-elements/internal/sc-element";

export abstract class ScInput extends ScElement {
  /** The single writable target: a PLAIN single-path `bind:value` resolves
   *  to exactly one state element with no expression. Expression binds have
   *  no writable target — the input is a read-only meter. */
  protected get targetScState(): ScState | undefined {
    const prop = this.runtimeProps?.value;
    if (!prop || prop.expression) return undefined;
    const targets = Object.values(prop.targets);
    return targets.length === 1 ? targets[0] : undefined;
  }

  /** A state value as a widget number — undefined (leave the widget as-is)
   *  when the value is unset or a non-numeric string: the base widgets'
   *  Number props must not receive strings. */
  protected numericState(value: StateValue | undefined): number | undefined {
    if (value === undefined) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }

  /** Map the live value onto this input's widget-facing state. Driven by
   *  the base machinery's recompute (below) — initial + every change — and
   *  seeded from the static attribute for unbound widgets. `undefined` =
   *  no value yet — leave the widget as-is. */
  protected syncFromState(_value: StateValue | undefined): void {}

  /** The widget rides the generic recompute — no extra subscription. */
  protected runtimeValueChanged(name: string, _prev: StateValue | undefined, next: StateValue) {
    if (name === "value") this.syncFromState(next);
  }

  async load(): Promise<void> {
    // super.load()'s synchronous prefix wires the bind:value recompute — its
    // initial run reaches syncFromState through the hook above. Only the
    // STATIC-value case (no bind:value) needs an explicit seed.
    const loading = super.load();
    if (!this.runtimeProps?.value) {
      this.syncFromState(this.getProp("value") as StateValue | undefined);
    }
    await loading;
  }

  /** The write path: dispatch to the target, then re-read and re-sync. A
   *  write to DERIVED (read-only) state is inert, so the re-read snaps the
   *  widget back to the real value; for a literal target the synchronous
   *  statechange echo has already synced through the hook (a no-op re-sync).
   *  The explicit re-sync + forced update is LOAD-BEARING for the
   *  unchanged-value case: the gesture moved the widget DOM, not the
   *  reactive field, so the hook never fires (Object.is guard) and Lit alone
   *  would skip the render `live()` needs. The middle arm serves the
   *  static-value (unbound) case; the last arm is the never-settled-target
   *  parity hole (the gesture value sticks — same as the old seam). */
  protected commit(value: StateValue): void {
    this.targetScState?.setValue(value);
    this.syncFromState(
      this.runtimeValue("value") ?? (this.getProp("value") as StateValue | undefined) ?? value,
    );
    this.requestUpdate();
  }
}
