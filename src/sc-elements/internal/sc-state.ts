// Base for the stateful elements (sc-control / sc-var): a named value binds
// can target. The `name`/`value`/`bind` attributes, their shared validation
// (value xor bind), the state runtime (`value`/`targets`/`expression`) — and
// the live value seam itself: every enabled state element is one key of the
// app store's `runtime` slice (its full named path under the plugin root),
// with `selectValue()` as the read view and `setValue()` as the public write.
// The subclasses differ in when they're enabled (a control when its parent is
// a node, a var always) and in what a write dispatches (a control adds the
// /n_set — see `dispatchValue`; a var is store-only).
//
// Bound state (`bind="a.b * 2"`) is DERIVED: the load pass computes it from
// its targets' store keys and re-computes on every target change — the
// shared machinery in internal/derived.ts (also powering the read-only
// visuals). Each dispatch is Object.is-guarded, so a converged recompute is
// free. Derived values are read-only: `setValue` on bound state is a no-op
// (the old app's writes to bound state were equally inert).

import { property } from "lit/decorators.js";
import {
  getRuntimeValue,
  seedRuntimeValue,
  selectRuntimeValue,
  setRuntimeValue,
} from "@/stores/runtime";
import type { ReadonlyStore } from "@/lib/utils/reactiveStore";
import type { Expr, RuntimeContext, StateRuntime } from "@/types/runtime";
import { observeDerived } from "@/sc-elements/internal/derived";
import {
  baseRuntime,
  failValidation,
  requireNumeric,
  requireProp,
  resolveStateBind,
} from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

export abstract class ScState extends ScElement {
  @property() accessor name = "";
  @property() accessor bind: string | undefined = undefined;
  @property({ type: Number }) accessor value: number | undefined = undefined;

  /** Bind path → the live target state element (set when bound). */
  targets?: Record<string, ScState>;
  /** Parsed arithmetic bind expression, when the bind isn't a plain path. */
  expression?: Expr;

  /** Store/target unsubscribes (set in load, cleared on unload/disconnect). */
  private offs: Array<() => void> = [];

  validate(): void {
    requireProp(this, "name", this.name);
    if (this.bind !== undefined && this.value !== undefined) {
      failValidation(this, `"value" and "bind" are mutually exclusive`);
    }
    requireNumeric(this, "value", this.value);
  }

  /** Resolve the literal/bound value into the live `value` property. Only
   *  enabled state resolves its bind and gets the normalized live value —
   *  disabled state (a pure graph input inside synthdefs/ugens) keeps the
   *  prop as the plain attribute mirror, so the graph collection can still
   *  tell a missing `value` attribute apart. */
  protected stateRuntime(ctx: RuntimeContext, enabled: boolean): StateRuntime {
    if (!enabled) {
      return { ...baseRuntime(ctx), enabled };
    }
    if (this.bind) {
      const { targets, expression } = resolveStateBind(this, ctx, this.bind);
      return { ...baseRuntime(ctx), enabled, value: 0, targets, expression };
    }
    return { ...baseRuntime(ctx), enabled, value: this.value ?? 0 };
  }

  /** The element's key in the plugin's store map: the named ancestor path
   *  plus its own name (the plugin root contributes no segment). */
  get key(): string {
    return [...this.path, this.name].join(".");
  }

  /** Read-only view onto this element's store value — the read seam the
   *  bound inputs/displays subscribe through. */
  selectValue(): ReadonlyStore<number | undefined> {
    return selectRuntimeValue(this._rootScNode.id, this.key);
  }

  /** The internal write: Object.is-guarded store update, reporting whether
   *  the value actually moved. ScControl extends it with the /n_set on the
   *  owning node — every dispatch path (user writes AND bound recomputes)
   *  goes through here. */
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

  /** Wire the store key: literal state seeds its declarative default (a
   *  reload keeps user-moved values), bound state writes its computed value
   *  and re-computes on every target change (internal/derived.ts). Both
   *  mirror the key into the live `value` prop — in that order, so a parent
   *  synth's getControls() reads the settled value. No OSC here on the
   *  initial write: the owning node isn't loaded yet (defaults ride its
   *  /s_new). Re-entrant (reconnect reload): stale subscriptions are dropped
   *  first. */
  async load(): Promise<void> {
    this.dropSubscriptions();
    if (this.enabled && this.isConnected) {
      if (this.targets) {
        this.offs.push(
          observeDerived(this.targets, this.expression, (v) => void this.dispatchValue(v)),
        );
      } else {
        seedRuntimeValue(this._rootScNode.id, this.key, this.value ?? 0);
      }
      const view = this.selectValue();
      this.value = view.get(); // subscribe() is change-only — sync once
      this.offs.push(
        view.subscribe((v) => {
          if (v !== undefined) this.value = v;
        }),
      );
    }
    await super.load();
  }

  /** The inverse of load(): drop the subscriptions (re-established by the
   *  reconnect reload). The store key itself survives — it's only dropped
   *  with the plugin's unmount. */
  unload(): void {
    super.unload();
    this.dropSubscriptions();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.dropSubscriptions();
  }

  private dropSubscriptions(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }
}
