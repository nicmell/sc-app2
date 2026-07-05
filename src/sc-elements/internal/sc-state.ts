// Base for the stateful elements (sc-control / sc-var): a NAMED value binds
// can target. On top of ScDerived's live `_state` + "statechange" it adds the
// `name`/`value` attributes, their shared validation (value xor bind), and
// the runtime-store backing for LITERAL state:
//
//   - LITERAL state (a `value` attribute — real, user-writable state) is one
//     key of the app store's `runtime` slice (its full named path under the
//     plugin root): the load pass seeds the declarative default (a reload
//     keeps user-moved values) and mirrors the store key into `_state`, so
//     external store writes (a second input, future presets) notify
//     dependents through the uniform statechange — with no OSC (see
//     ScControl: /n_set lives on the WRITE path only).
//   - BOUND state (a `bind` expression) is pure inherited ScDerived
//     behavior: `_state` derives from the targets, there is NO store key,
//     and writes are inert (`setValue` on derived state is a no-op — the old
//     app's writes to bound state were equally inert).
//
// The `value` prop itself is the plain declarative attribute mirror — the
// live value is `_state` (the old app's exact value/_state split; the graph
// collection relies on telling a missing `value` attribute apart).
//
// A state element must be declared ON A NODE: its store key/path derives
// from the named ancestors, and a path-transparent container (sc-if,
// sc-select, sc-radio-group — no path segment of their own) would let a
// same-named element silently share an outer key. Controls encode the rule
// in their enablement; vars enforce it as a parse error.

import { property } from "lit/decorators.js";
import {
  getRuntimeValue,
  seedRuntimeValue,
  selectRuntimeValue,
  setRuntimeValue,
} from "@/stores/runtime";
import type { RuntimeContext, DerivedRuntime } from "@/types/runtime";
import {
  baseRuntime,
  failValidation,
  requireNumeric,
  requireProp,
} from "@/sc-elements/internal/validation";
import { ScDerived } from "@/sc-elements/internal/sc-derived";

export abstract class ScState extends ScDerived {
  @property() accessor name = "";
  @property({ type: Number }) accessor value: number | undefined = undefined;

  validate(): void {
    requireProp(this, "name", this.name);
    if (this.bind !== undefined && this.value !== undefined) {
      failValidation(this, `"value" and "bind" are mutually exclusive`);
    }
    requireNumeric(this, "value", this.value);
  }

  /** Resolve the state runtime: bound state gets its targets/expression,
   *  literal state explicitly clears them (a re-process must not leave stale
   *  bound fields behind). Disabled state (a pure graph input inside
   *  synthdefs/ugens) resolves neither — its `value` prop stays the plain
   *  attribute mirror the graph collection reads. */
  protected stateRuntime(ctx: RuntimeContext, enabled: boolean): DerivedRuntime {
    if (!enabled) {
      return { ...baseRuntime(ctx), enabled };
    }
    if (this.bind) {
      return { ...this.derivedRuntime(ctx), enabled };
    }
    return { ...baseRuntime(ctx), enabled, targets: undefined, expression: undefined };
  }

  /** The element's key in the plugin's store map: the named ancestor path
   *  plus its own name (the plugin root contributes no segment). Literal
   *  state only — bound state has no store key. */
  protected get key(): string {
    return [...this.path, this.name].join(".");
  }

  /** The internal write: Object.is-guarded store update, reporting whether
   *  the value actually moved. ScControl extends it with the /n_set on the
   *  owning node — the user-gesture WRITE path. The store echo runs
   *  updateState (and the statechange to dependents) synchronously. */
  protected dispatchValue(next: number): boolean {
    if (Object.is(getRuntimeValue(this._rootScNode.id, this.key), next)) return false;
    setRuntimeValue(this._rootScNode.id, this.key, next);
    return true;
  }

  /** The public write path (what inputs call). Bound state is derived and
   *  therefore read-only — the write is silently inert, like the old app's. */
  setValue(next: number): void {
    if (!this.enabled || this.targets) return;
    this.dispatchValue(next);
  }

  /** Literal state wires its store key: seed the declarative default, sync
   *  `_state` once (subscriptions are change-only), then mirror every store
   *  write into `_state` — which notifies dependents via statechange. Bound
   *  state takes the inherited ScDerived path (recompute over the targets).
   *  The `undefined` guard keeps a dropped plugin map from propagating. */
  async load(): Promise<void> {
    // super.load()'s synchronous prefix drops the stale subscriptions FIRST
    // (re-entrant reload) — state elements are leaves, so nothing awaits
    // before the store wiring below registers; no write can slip the gap.
    const loading = super.load();
    if (this.enabled && this.isConnected && !this.targets) {
      seedRuntimeValue(this._rootScNode.id, this.key, this.value ?? 0);
      const view = selectRuntimeValue(this._rootScNode.id, this.key);
      const v = view.get();
      if (v !== undefined) this.updateState(v);
      this.addStateSubscription(
        view.subscribe((next) => {
          if (next !== undefined) this.updateState(next);
        }),
      );
    }
    await loading;
  }
}
