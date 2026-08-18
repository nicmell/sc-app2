// Base for the stateful elements (sc-control / sc-var): a NAMED value binds
// can target. On top of ScElement's runtime-prop machinery it adds the
// `name`/`value` attributes and the runtime-store backing for LITERAL state:
//
//   - LITERAL state (a `value` attribute — real, user-writable state) is one
//     key of the plugin root's per-instance runtime store (its full named
//     path under the plugin root): the load pass seeds the declarative
//     default (a reload keeps user-moved values) and mirrors the store key
//     into `_state`, so external store writes (a second input, future
//     presets) notify dependents through the uniform statechange — with no
//     OSC (see ScControl: /n_set lives on the WRITE path only).
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

import type { Store } from "@/lib/utils/reactiveStore";
import { isPluginRuntime } from "@/lib/utils/guards";
import type { PluginRuntimeValues, StateValue } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

export abstract class ScState extends ScElement {
  /** The element's live value — the derived `value` runtime prop, or the
   *  store-backed value for literal state. */
  get _state(): StateValue | undefined {
    return this.runtimeValue("value");
  }

  /** Derived state (a `bind:value` expression): read-only, no store key. */
  protected get derived(): boolean {
    return this.runtimeProps?.value !== undefined;
  }


  /** The element's key in the plugin's store map: the named ancestor path
   *  plus its own name (the plugin root contributes no segment). Literal
   *  state only — derived state has no store key. */
  protected get key(): string {
    return [...this.path, this.getProp("name") as string].join(".");
  }

  /** The plugin root's per-instance runtime store — _rootScNode IS the
   *  <sc-plugin> host for every parsed element (pinned by examples.test). */
  get #pluginRuntime(): Store<PluginRuntimeValues> | undefined {
    return isPluginRuntime(this._rootScNode) ? this._rootScNode.runtime : undefined;
  }

  /** The internal write: Object.is-guarded store update, reporting whether
   *  the value actually moved. ScControl extends it with the /n_set on the
   *  owning node — the user-gesture WRITE path. The store echo runs
   *  updateRuntimeValue (and the statechange to dependents) synchronously. */
  protected dispatchValue(next: StateValue): boolean {
    const store = this.#pluginRuntime;
    if (!store || Object.is(store.get()[this.key], next)) return false;
    store.update((s) => ({ ...s, [this.key]: next }));
    return true;
  }

  /** The public write path (what inputs call). Derived state is read-only —
   *  the write is silently inert, like the old app's. Graph-plane state
   *  (synthdef params, ugen inputs) is NOT writable: nothing legitimate
   *  reaches it (binds cannot target it, its subtree never loads) — callers
   *  going out of their way via walkPath get an orphan store key. */
  setValue(next: StateValue): void {
    if (this.derived) return;
    this.dispatchValue(next);
  }

  /** Literal state wires its store key: seed the declarative default, sync
   *  `_state` once (subscriptions are change-only), then mirror every store
   *  write into `_state` — which notifies dependents via statechange. Derived
   *  state takes the inherited runtime-prop path (recompute over the
   *  targets). The `undefined` guard keeps a missing key from propagating. */
  async load(): Promise<void> {
    // super.load()'s synchronous prefix drops the stale subscriptions FIRST
    // (re-entrant reload) — state elements are leaves, so nothing awaits
    // before the store wiring below registers; no write can slip the gap.
    const loading = super.load();
    // No graph-plane guard needed: ScSynthDef.load never recurses into its
    // subtree, so only node-parented state ever reaches this wiring.
    const store = this.#pluginRuntime;
    if (store && this.isConnected && !this.derived) {
      const seed = (this.getProp("value") as StateValue) ?? 0;
      store.update((s) => (s[this.key] !== undefined ? s : { ...s, [this.key]: seed }));
      const view = store.select((s) => s[this.key]);
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
