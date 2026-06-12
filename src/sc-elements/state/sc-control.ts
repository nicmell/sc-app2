// <sc-control> — a named parameter: a literal `value` or a `bind` reference
// (mutually exclusive; declared on the ScState base together with the shared
// validation and runtime). Enabled when the parent is a node (plugin/group/
// synth); a pure graph input inside synthdefs/ugens.
//
// An enabled control is one key of the app store's `controls` slice — its
// full named path under the plugin root (e.g. "s1.freq"). The load pass
// seeds the declarative `value` attribute as the key's default and mirrors
// the key back into the reactive `value` prop. `setValue` is the ONLY
// OSC-dispatching write path: store update + /n_set on the owning node.
// Writes landing in the store from elsewhere only refresh the subscribed
// views — no echo, so two inputs bound to one control converge through the
// shared key with exactly one /n_set per gesture.

import { nSet } from "@sc-app/server-commands";
import { isNodeRuntime } from "@/lib/utils/guards";
import { oscClient } from "@/stores/osc";
import { getControlValue, seedControlValue, selectControlValue, setControlValue } from "@/stores/controls";
import type { ReadonlyStore } from "@/lib/utils/reactiveStore";
import type { RuntimeContext, StateRuntime } from "@/types/runtime";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScControl extends ScState {
  /** Unsubscribe from the store key (set in load, cleared on disconnect). */
  private offValue?: () => void;

  protected resolveRuntime(ctx: RuntimeContext): StateRuntime {
    return this.stateRuntime(ctx, ctx.parentNode != null && isNodeRuntime(ctx.parentNode));
  }

  /** The control's key in the plugin's store map: the named ancestor path
   *  plus its own name (the plugin root contributes no segment). */
  get key(): string {
    return [...this.path, this.name].join(".");
  }

  /** Read-only view onto this control's store value — the read seam the
   *  bound inputs/displays subscribe through. */
  selectValue(): ReadonlyStore<number | undefined> {
    return selectControlValue(this._rootScNode.id, this.key);
  }

  /** The single write path: store update + /n_set on the owning node (when
   *  it is live). The store echo refreshes this element's own `value` prop
   *  via the load-pass subscription. */
  setValue(next: number): void {
    if (!this.enabled) return;
    if (Object.is(getControlValue(this._rootScNode.id, this.key), next)) return;
    setControlValue(this._rootScNode.id, this.key, next);
    const parent = this._parentScNode;
    if (parent && isNodeRuntime(parent) && parent.loaded && parent.nodeId !== 0) {
      oscClient.send(nSet(parent.nodeId, { [this.name]: next }));
    }
  }

  /** Seed the declarative default and mirror the store key into the live
   *  `value` prop. No OSC here — the defaults ride the parent's /s_new. */
  async load(): Promise<void> {
    if (this.enabled && this.isConnected) {
      seedControlValue(this._rootScNode.id, this.key, this.value ?? 0);
      const view = this.selectValue();
      this.value = view.get(); // subscribe() is change-only — sync once
      this.offValue = view.subscribe((v) => {
        if (v !== undefined) this.value = v;
      });
    }
    await super.load();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.offValue?.();
    this.offValue = undefined;
  }
}
