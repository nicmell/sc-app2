// Base for the stateful elements (sc-control / sc-var): a NAMED value binds
// can target. On top of ScElement's runtime-prop machinery it adds the
// `name`/`value` attributes and the runtime-store backing for LITERAL state:
//
//   - LITERAL state (a `value` attribute — real, user-writable state) is one
//     key of the app store's `runtime` slice (its full named path under the
//     plugin root): the load pass seeds the declarative default (a reload
//     keeps user-moved values) and mirrors the store key into `_state`, so
//     external store writes (a second input, future presets) notify
//     dependents through the uniform statechange — with no OSC (see
//     ScControl: /n_set lives on the WRITE path only).
//   - DERIVED state (a `bind:value` expression) is pure inherited runtime-prop
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

import {
  getRuntimeValue,
  seedRuntimeValue,
  selectRuntimeValue,
  setRuntimeValue,
} from "@/stores/runtime";
import type { BaseRuntime, RuntimeContext, StateValue } from "@/types/runtime";
import { baseRuntime, requireName } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

export abstract class ScState extends ScElement {
  validate(): void {
    requireName(this);
    // value XOR bind:value is the generic validateProps mutual exclusion.
  }

  /** The element's live value — the derived `value` runtime prop, or the
   *  store-backed value for literal state. */
  get _state(): StateValue | undefined {
    return this.runtimeValue("value");
  }

  /** Derived state (a `bind:value` expression): read-only, no store key. */
  protected get derived(): boolean {
    return this.runtimeProps?.value !== undefined;
  }

  /** Resolve the state runtime — just the enablement: the `bind:value` (when
   *  present) is resolved by the base's generic runtime-prop pass. Disabled
   *  state (a pure graph input inside synthdefs/ugens) stays a plain
   *  attribute mirror the graph collection reads. */
  protected stateRuntime(ctx: RuntimeContext, enabled: boolean): BaseRuntime {
    return { ...baseRuntime(ctx), enabled };
  }

  /** The element's key in the plugin's store map: the named ancestor path
   *  plus its own name (the plugin root contributes no segment). Literal
   *  state only — derived state has no store key. */
  protected get key(): string {
    return [...this.path, this.getProp("name") as string].join(".");
  }

  /** The internal write: Object.is-guarded store update, reporting whether
   *  the value actually moved. ScControl extends it with the /n_set on the
   *  owning node — the user-gesture WRITE path. The store echo runs
   *  updateRuntimeValue (and the statechange to dependents) synchronously. */
  protected dispatchValue(next: StateValue): boolean {
    if (Object.is(getRuntimeValue(this._rootScNode.id, this.key), next)) return false;
    setRuntimeValue(this._rootScNode.id, this.key, next);
    return true;
  }

  /** The public write path (what inputs call). Derived state is read-only —
   *  the write is silently inert, like the old app's. */
  setValue(next: StateValue): void {
    if (!this.enabled || this.derived) return;
    this.dispatchValue(next);
  }

  /** Literal state wires its store key: seed the declarative default, sync
   *  `_state` once (subscriptions are change-only), then mirror every store
   *  write into `_state` — which notifies dependents via statechange. Derived
   *  state takes the inherited runtime-prop path (recompute over the
   *  targets). The `undefined` guard keeps a dropped plugin map from
   *  propagating. */
  async load(): Promise<void> {
    // super.load()'s synchronous prefix drops the stale subscriptions FIRST
    // (re-entrant reload) — state elements are leaves, so nothing awaits
    // before the store wiring below registers; no write can slip the gap.
    const loading = super.load();
    if (this.enabled && this.isConnected && !this.derived) {
      seedRuntimeValue(this._rootScNode.id, this.key, (this.getProp("value") as StateValue) ?? 0);
      const view = selectRuntimeValue(this._rootScNode.id, this.key);
      const v = view.get();
      if (v !== undefined) this.updateRuntimeValue("value", v);
      this.addRuntimeSubscription(
        view.subscribe((next) => {
          if (next !== undefined) this.updateRuntimeValue("value", next);
        }),
      );
    }
    await loading;
  }
}
