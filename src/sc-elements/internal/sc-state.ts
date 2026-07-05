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
// its targets' store keys and re-computes on every target change (push
// propagation over the reactive store). The bind-order constraint makes the
// target graph a DAG resolved in DOM order, so the initial load settles in
// one pass and propagation terminates. Diamond dependencies (A feeds B and C,
// D = B + C) can transiently dispatch once per intermediate before
// converging — accepted; each dispatch is Object.is-guarded, so a converged
// recompute is free. Derived values are read-only: `setValue` on bound state
// is a no-op (the old app's writes to bound state were equally inert).

import { property } from "lit/decorators.js";
import { evalExpr } from "@/lib/utils/expression";
import {
  getRuntimeValue,
  seedRuntimeValue,
  selectRuntimeValue,
  setRuntimeValue,
} from "@/stores/runtime";
import type { ReadonlyStore } from "@/lib/utils/reactiveStore";
import type { Expr, RuntimeContext, StateRuntime } from "@/types/runtime";
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
    this.claimStateKey(ctx);
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

  /** Claim this element's store key for the parse. sc-if contributes no path
   *  segment, so a same-named state element inside it would silently share
   *  the key of one outside — the per-parse map makes it a parse error (the
   *  same-scope case is caught earlier by checkDuplicateNames). */
  private claimStateKey(ctx: RuntimeContext): void {
    const key = [...ctx.path, this.name].join(".");
    const claimed = ctx.stateKeys?.get(key);
    if (claimed && claimed !== this) {
      throw new Error(
        `<${this.tagName.toLowerCase()} name="${this.name}">: duplicate name in scope`,
      );
    }
    ctx.stateKeys?.set(key, this);
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

  /** The derived value: the targets' current store values through the bind
   *  expression (a plain single-path bind is the identity). `undefined` when
   *  any target key is gone — the plugin map is being dropped; recomputing
   *  would resurrect it. */
  private computeBound(targets: Record<string, ScState>): number | undefined {
    const values: Record<string, number> = {};
    for (const [path, target] of Object.entries(targets)) {
      const v = target.selectValue().get();
      if (v === undefined) return undefined;
      values[path] = v;
    }
    if (this.expression) return evalExpr(this.expression, values);
    const [first] = Object.values(values);
    return first;
  }

  /** Wire the store key: literal state seeds its declarative default (a
   *  reload keeps user-moved values), bound state writes its computed value
   *  and re-computes on every target change. Both mirror the key into the
   *  live `value` prop — in that order, so a parent synth's getControls()
   *  reads the settled value. No OSC here on the initial write: the owning
   *  node isn't loaded yet (defaults ride its /s_new). Re-entrant (reconnect
   *  reload): stale subscriptions are dropped first. */
  async load(): Promise<void> {
    this.dropSubscriptions();
    if (this.enabled && this.isConnected) {
      const targets = this.targets;
      if (targets) {
        const recompute = () => {
          const v = this.computeBound(targets);
          if (v !== undefined) this.dispatchValue(v);
        };
        recompute();
        for (const target of Object.values(targets)) {
          this.offs.push(target.selectValue().subscribe(recompute));
        }
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
