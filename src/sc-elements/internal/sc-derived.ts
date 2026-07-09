// Base for every element with a LIVE VALUE on the state graph: the bound
// state elements (sc-control / sc-var via ScState) and the read-only visuals
// (sc-display / sc-if). It owns:
//
//   - `bind` — a full evaluable expression (plain paths, arithmetic,
//     comparisons) resolved at parse into `targets` (live ScState refs) +
//     `expression` (AST);
//   - `_state` — the element's live value, with `updateState()` as the single
//     internal writer (Object.is-guarded);
//   - "statechange" — a non-bubbling CustomEvent dispatched on every real
//     `_state` move; `onStateChange()` is the subscription seam every reader
//     (inputs, visuals, downstream bound state) uses uniformly.
//
// A BOUND element derives `_state` by evaluating its expression over the
// targets' `_state`, re-computing on their statechange — element-to-element
// push propagation, no store involvement (only LITERAL state is store-backed;
// see ScState). The bind-order constraint makes the target graph a DAG
// resolved in DOM order, so the initial load settles in one pass and
// propagation terminates; diamond dependencies can transiently dispatch once
// per intermediate before converging — accepted, each hop is Object.is-
// guarded. Because no event fires for an unchanged value, dependents pull
// their initial in load() (the initial recompute) rather than waiting for a
// notification.

import { evalExpr } from "@/lib/utils/expression";
import type { DerivedRuntime, Expr, RuntimeContext } from "@/types/runtime";
import { baseRuntime, resolveStateBind } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";
import type { ScState } from "@/sc-elements/internal/sc-state";

export abstract class ScDerived extends ScElement {
  /** Bind path → the live target state element (set when bound). */
  targets?: Record<string, ScState>;
  /** Parsed bind expression, when the bind isn't a plain path. */
  expression?: Expr;

  #state?: number;

  /** Target/store unsubscribes (set in load, cleared on unload/disconnect). */
  private offs: Array<() => void> = [];

  /** The element's live value — the computed expression for bound elements,
   *  the store-backed value for literal state (ScState). */
  get _state(): number | undefined {
    return this.#state;
  }

  /** The single internal writer: Object.is-guarded, re-renders, runs the
   *  subclass side-effect hook (BEFORE notifying, so an element's own effect
   *  — e.g. ScControl's /n_set — precedes its dependents' recomputes), then
   *  dispatches the non-bubbling "statechange". Never call from
   *  willUpdate/render (it schedules an update). */
  protected updateState(next: number): void {
    const prev = this.#state;
    if (Object.is(prev, next)) return;
    this.#state = next;
    this.requestUpdate();
    this.stateChanged(prev, next);
    this.dispatchEvent(new CustomEvent<number>("statechange", { detail: next }));
  }

  /** Subclass side-effect hook for a real `_state` move (ScControl: the
   *  bound-recompute /n_set). */
  protected stateChanged(_prev: number | undefined, _next: number): void {}

  /** Subscribe to this element's value changes; returns the unregister.
   *  Change-only (no initial call) — read `_state` for the current value. */
  onStateChange(cb: (value: number) => void): () => void {
    const listener = (e: Event) => cb((e as CustomEvent<number>).detail);
    this.addEventListener("statechange", listener);
    return () => this.removeEventListener("statechange", listener);
  }

  /** The runtime of a pure derived element: the resolved bind over the base
   *  core (subclasses spread extra fields where needed). */
  protected derivedRuntime(ctx: RuntimeContext): DerivedRuntime {
    const { targets, expression } = resolveStateBind(this, ctx, this.getProp("bind") as string);
    return { ...baseRuntime(ctx), targets, expression };
  }

  /** The derived value right now: the targets' `_state` through the
   *  expression (a plain single-path bind is the identity). `undefined` when
   *  any target has no value yet — evaluating would push NaN downstream. */
  private computeDerived(targets: Record<string, ScState>): number | undefined {
    const values: Record<string, number> = {};
    for (const [path, target] of Object.entries(targets)) {
      const v = target._state;
      if (v === undefined) return undefined;
      values[path] = v;
    }
    if (this.expression) return evalExpr(this.expression, values);
    const [first] = Object.values(values);
    return first;
  }

  /** Wire a bound element: compute the initial value (the targets are
   *  earlier in DOM order, so their `_state` has settled) and re-compute on
   *  every target statechange. Re-entrant (reconnect reload): stale
   *  listeners are dropped first, or a reload would double-register. */
  async load(): Promise<void> {
    this.dropStateSubscriptions();
    const targets = this.targets;
    if (targets) {
      const recompute = () => {
        const v = this.computeDerived(targets);
        if (v !== undefined) this.updateState(v);
      };
      recompute();
      for (const target of Object.values(targets)) {
        this.offs.push(target.onStateChange(recompute));
      }
    }
    await super.load();
  }

  unload(): void {
    super.unload();
    this.dropStateSubscriptions();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.dropStateSubscriptions();
  }

  /** Also the seam ScState uses to add its store subscription. */
  protected addStateSubscription(off: () => void): void {
    this.offs.push(off);
  }

  private dropStateSubscriptions(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }
}
