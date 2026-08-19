// The base of the parsed plugin elements — and the runtime itself: there is
// no separate item structure. The element IS the runtime — `process()`
// assigns the identity + shared core (the parent collects the element into
// its `_scChildren`), then runs the TWO conceptual steps every component can extend
// through `super`: `validate()` (purely STATIC — the spec gate; no ctx, so
// it can resolve nothing) and `resolveRuntime(ctx)` (runtime construction —
// bind/reference resolution AND the recursion into sc children: the
// runtime tree `_scChildren` is a runtime value like the rest, built by the
// level-opening overrides via `processChildren`; all plain fields declared
// here and on the category bases: internal/sc-node, sc-state, sc-input).
// Bind targets must be declared BEFORE their references in the DOM (see
// CLAUDE.md — processing is strict DOM order). The validation and
// bind-resolution helpers the two steps build on live in
// internal/validation.ts.
// Declarative HTML attributes are NOT reactive properties — they are read on
// demand via `getProp`, coerced by the element's spec (the single source that
// also generates the XSD); only the handful of genuinely-reactive fields (a
// widget's `value`/`_checked`/…) stay as Lit properties. Runtime values are
// plain fields.
//
// RUNTIME PROPS: every spec attr (unless flagged `runtime: false`) accepts a
// `bind:`-namespaced sibling attribute holding a bind expression
// (`bind:min="vars.lo"`, `bind:value="osc.freq * 2"`,
// `bind:icon="s1.gate ? 'stop' : 'play'"`) — mutually exclusive with the
// static attribute. The namespace (`xmlns:bind="urn:sc-app:bind"`, declared
// on the entry root) makes the markup namespace-well-formed; the runtime
// matches by QUALIFIED NAME (`getAttribute("bind:min")` — the one attribute
// API portable across happy-dom and Chrome; getAttributeNS is NOT). The
// canonical `bind` prefix is enforced (validateProps rejects foreign
// prefixes — the XSD admits by namespace, the runtime by name).
// `process()` resolves each into live targets (+ parsed expression);
// `load()` computes the initial value and recomputes on every target's
// statechange, feeding `getProp` (and, for the `value` prop, the state
// elements' `_state` + the "statechange" event that notifies dependents).
// Element-to-element push propagation — the bind-order constraint makes the
// target graph a DAG resolved in DOM order, so the initial load settles in
// one pass; diamond dependencies can transiently dispatch once per
// intermediate before converging — accepted, each hop is Object.is-guarded.
//
// Still unported (return with their migration steps): the buffer family
// (sc-buffer/waveform/test + the old buffer-bound scope), presets/overrides.

import { LitElement } from "lit";
import { evalExpr } from "@/lib/expression";
import { isNodeRuntime, isStateRuntime } from "@/lib/utils/guards";
import { contentHash } from "@/sc-elements/internal/contentHash";
import {
  coerceBoolean,
  coerceScalar,
  coerceVector,
  coerceStatic,
  resolveStateBind,
  validateProps,
} from "@/sc-elements/internal/validation";
import type { ScParent } from "@/sc-elements/internal/sc-parent";
import { SPECS } from "@/sc-elements/internal/xsd/registry";
import { bindAttr, type AttrSpec, type ElementSpec } from "@/sc-elements/internal/xsd/types";
import type { RuntimeContext, RuntimeProp, StateValue } from "@/types/runtime";

/** A bind path's numeric SLOT tail (`env.5` → 5), or null for plain paths —
 *  names cannot start with a digit, so the tail is unambiguous. */
export function slotIndexOf(path: string): number | null {
  const tail = path.slice(path.lastIndexOf(".") + 1);
  return path.includes(".") && /^\d+$/.test(tail) ? Number(tail) : null;
}


export abstract class ScElement extends LitElement {
  // ── Runtime values (assigned by `process`; plain fields, not reactive) ──

  /** The parsed identity — the native DOM id; `process` mints the
   *  path-chained hash (the browser reflects it to the attribute). */
  declare id: string;
  /** The plugin root element this element was parsed under. */
  _rootScNode!: ScParent;
  /** The parsed parent element (unset at the root). */
  _parentScNode?: ScParent;
  /** The named ancestor path (scope names, outermost first). */
  basePath: string[] = [];
  /** The resolved runtime props (`bind:min="vars.lo"` → key "min"): live bind
   *  targets + parsed expression per prop, assigned in `process()`. */
  runtimeProps?: Record<string, RuntimeProp>;

  /** The live evaluated runtime-prop values (keyed like `runtimeProps`) —
   *  also the store-fed backing of a literal state element's `value`. */
  #runtime: Record<string, StateValue | undefined> = {};
  /** Target/store unsubscribes (set in load, cleared on unload/disconnect). */
  #offs: Array<() => void> = [];

  /** Render into the light DOM so plugin markup children stay visible. */
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  /** Create a Lit-managed shadow root for visual wrappers that project their
   *  authored children through a slot. Unlike calling attachShadow directly,
   *  this adopts the concrete element class's `static styles`. */
  protected createShadowRenderRoot(): HTMLElement | DocumentFragment {
    return super.createRenderRoot();
  }

  /** This element's spec (its colocated `<tag>.spec.ts`) — the single source
   *  for its declarative attribute contract. `getProp`/`validateProps` read it. */
  get spec(): ElementSpec | undefined {
    return SPECS.get(this.tagName.toLowerCase());
  }

  /** Read a declarative attribute, coerced per the spec. UNTYPED — cast at the
   *  call site (`this.getProp("min") as number`). A declared spec `default` is
   *  returned, with the same coercion as a static value, when neither the
   *  static attr nor a settled `bind:` value is present; undeclared attrs stay
   *  undefined, so a forwarded prop then falls back to the base widget's own
   *  default. When the attr is runtime-flagged and its `bind:` form is present,
   *  this returns the LIVE evaluated value instead (undefined until the targets
   *  settle) — reads from render() re-run on every recompute. The genuinely-
   *  reactive fields (a widget's `value`, `_checked`, …) are NOT declarative
   *  attributes and stay as reactive class fields. */
  getProp(name: string): string | number | boolean | number[] | undefined {
    const attr = this.spec?.attrs?.[name];
    if (attr && attr.runtime !== false && this.hasAttribute(bindAttr(name))) {
      return this.coerceProp(attr, name, this.#runtime[name]) ?? this.coerceDefault(attr);
    }
    const raw = this.getAttribute(name);
    if (raw === null) return this.coerceDefault(attr);
    return coerceStatic(attr, raw);
  }

  /** Apply static lexical coercion to a spec default. Stringifying first keeps
   *  defaults authored as numbers/booleans on their native shapes while still
   *  making a string default on (for example) an integer attr numeric. */
  private coerceDefault(
    attr: AttrSpec | undefined,
  ): string | number | boolean | number[] | undefined {
    if (attr?.default === undefined) return undefined;
    return coerceStatic(attr, String(attr.default));
  }

  /** Once-per-element+prop warning bookkeeping for evaluated-value type
   *  misses (per INSTANCE — AttrSpec objects are shared per tag via SPECS,
   *  so they can't key this). */
  #warned = new Set<string>();

  #warnOnce(name: string, message: string): void {
    if (this.#warned.has(name)) return;
    this.#warned.add(name);
    console.warn(`<${this.tagName.toLowerCase()}>: ${message}`);
  }

  /** Coerce an evaluated runtime value per the spec, keeping live warning
   *  bookkeeping on the element. Static values use the pure `coerceStatic`
   *  function in internal/validation.ts. */
  private coerceProp(
    attr: AttrSpec | undefined,
    name: string,
    value: StateValue | undefined,
  ): string | number | boolean | number[] | undefined {
    if (value === undefined) return undefined;
    if (attr?.type === "vector") return coerceVector(value);
    // Array values have no scalar coercion outside vector attrs — getProp
    // readers fall back to their defaults; the value rides `_state` instead.
    if (typeof value === "object") return undefined;
    if (attr?.type === "decimal" || attr?.type === "integer") {
      const n = Number(value);
      if (Number.isNaN(n)) {
        this.#warnOnce(
          name,
          `"${bindAttr(name)}" evaluated to non-numeric ${JSON.stringify(value)} — falling back`,
        );
        return undefined;
      }
      return n;
    }
    if (attr?.type === "boolean") {
      // The SAME HTML-flavored reading as the static form — a bound string
      // "false" disables like the attribute would.
      return coerceBoolean(value);
    }
    if (attr?.type === "scalar") {
      if (typeof value === "number") return value;
      return coerceScalar(value);
    }
    const s = String(value);
    if (attr?.type === "enum" && !attr.values.includes(s)) {
      this.#warnOnce(
        name,
        `"${bindAttr(name)}" evaluated to "${s}" — not one of ${attr.values.join("|")}`,
      );
    }
    return s; // string / enum
  }

  /** STEP 1 — STATIC validation: the spec-driven attribute gate. Takes no
   *  ctx by design — this step can resolve nothing. Overrides add their
   *  SEMANTIC rules (cross-attribute, positional) and MUST call
   *  `super.validate()`. A violation fails the whole plugin parse. */
  validate(): void {
    validateProps(this);
  }

  // ── The parse engine ────────────────────────────────────────────────────

  /** Process this element: pre-register it (so re-entrant resolves of a
   *  mid-processing ancestor return it), assign the identity + shared
   *  runtime core (the path-chained hash id minted from the level owner's
   *  id + the level's document-order counter, `_rootScNode`/`basePath`/
   *  `_parentScNode` — the level owner; the OWNER pushes this element onto
   *  its `_scChildren` once processing completes, see
   *  ScParent.processChildren), then run the TWO conceptual steps —
   *  `validate()` (static: the spec gate; ctx-free) and
   *  `resolveRuntime(ctx)` (runtime construction: the recursion into sc
   *  children where the element opens a level, bind/reference resolution) —
   *  both extendable per element THROUGH `super`. Library throws get the
   *  canonical `<tag>:` prefix; already-shaped errors pass through.
   *  Idempotent — an already-processed element is returned as-is. */
  process(ctx: RuntimeContext): ScElement {
    if (ctx.nodes.has(this)) {
      return this;
    }
    ctx.nodes.add(this);
    try {
      this.id = contentHash(this, ctx.parentNode?.id ?? "", ctx.index++);
      this._rootScNode = ctx.rootNode;
      this.basePath = ctx.path;
      this._parentScNode = ctx.parentNode;
      this.validate();
      this.resolveRuntime(ctx);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (e instanceof Error && message.startsWith("<")) throw e;
      throw new Error(`<${this.tagName.toLowerCase()}>: ${message}`, { cause: e });
    }
    return this;
  }


  /** STEP 2 — runtime construction: every present `bind:attr` becomes live
   *  targets + expression (the same machinery state binds use, so the
   *  bind-order constraint applies). The SYNTHDEF PLANE is skipped wholesale
   *  (a non-node level exists only inside sc-synthdef/sc-ugen): there a
   *  `bind:value` is a raw GRAPH reference the synthdef collectors consume —
   *  never resolved on the state graph; the loud on-a-param rejection is
   *  ScSynthDef's. Overrides add their element-specific construction — the
   *  level-opening elements build the runtime tree via `processChildren`
   *  (`_scChildren` is a runtime value like the rest), then references,
   *  graph collection, resolved-state rules — and MUST call
   *  `super.resolveRuntime(ctx)`. */
  protected resolveRuntime(ctx: RuntimeContext): void {
    this.runtimeProps = undefined; // a re-process must not keep stale binds
    if (ctx.parentNode && !isNodeRuntime(ctx.parentNode)) return;
    for (const [name, attr] of Object.entries(this.spec?.attrs ?? {})) {
      if (attr.runtime === false) continue;
      const expr = this.getAttribute(bindAttr(name));
      if (expr === null) continue;
      (this.runtimeProps ??= {})[name] = resolveStateBind(this, ctx, expr, bindAttr(name));
    }
  }

  // ── Runtime values (the live evaluated props / the state seam) ──────────

  /** The live evaluated value of a runtime prop (undefined until its targets
   *  settle). The `value` prop's slot doubles as a literal state element's
   *  store-fed backing (ScState). */
  protected runtimeValue(name: string): StateValue | undefined {
    return this.#runtime[name];
  }

  /** The single internal writer: Object.is-guarded, re-renders (reads go
   *  through `getProp` in render), runs the subclass side-effect hook (BEFORE
   *  notifying, so an element's own effect — e.g. ScControl's /n_set —
   *  precedes its dependents' recomputes), then, for a STATE element's
   *  `value` prop, dispatches the non-bubbling "statechange". The gate is
   *  sound because only named state is targetable — `resolveControlBind`
   *  matches `isStateRuntime` children exclusively — so an input's or
   *  visual's `value` recompute has no possible subscriber. Never call from
   *  willUpdate/render (it schedules an update). */
  protected updateRuntimeValue(name: string, next: StateValue): void {
    const prev = this.#runtime[name];
    if (Object.is(prev, next)) return;
    this.#runtime[name] = next;
    this.requestUpdate();
    this.runtimeValueChanged(name, prev, next);
    if (name === "value" && isStateRuntime(this)) {
      this.dispatchEvent(new CustomEvent<StateValue>("statechange", { detail: next }));
    }
  }

  /** Subclass side-effect hook for a real runtime-value move (ScControl: the
   *  derived-value /n_set on `value`). */
  protected runtimeValueChanged(_name: string, _prev: StateValue | undefined, _next: StateValue) {}

  /** Subscribe to this element's `value` changes; returns the unregister.
   *  Change-only (no initial call) — read `_state` for the current value. */
  onStateChange(cb: (value: StateValue) => void): () => void {
    const listener = (e: Event) => cb((e as CustomEvent<StateValue>).detail);
    this.addEventListener("statechange", listener);
    return () => this.removeEventListener("statechange", listener);
  }

  /** A runtime prop's value right now: the targets' `_state` through the
   *  expression (a plain single-path bind is the identity). A numeric path
   *  TAIL is an array-SLOT read (`env.5` = element 5 of the array state
   *  `env` — the read half of the slot lens; ScInput owns the write half).
   *  `undefined` when any target has no value yet — evaluating would push
   *  NaN downstream. */
  #computeRuntime(prop: RuntimeProp): StateValue | undefined {
    const values: Record<string, StateValue> = {};
    for (const [path, target] of Object.entries(prop.targets)) {
      let v = target._state;
      const slot = slotIndexOf(path);
      if (slot !== null) v = Array.isArray(v) ? v[slot] : undefined;
      if (v === undefined) return undefined;
      values[path] = v;
    }
    if (prop.expression) return evalExpr(prop.expression, values);
    const [first] = Object.values(values);
    return first;
  }

  /** The seam subclasses use to park a subscription on the shared lifecycle
   *  (ScState's store view, ScInput's target sync) — dropped with the runtime
   *  props' own on unload/disconnect/reload. */
  protected addRuntimeSubscription(off: () => void): void {
    this.#offs.push(off);
  }

  #dropRuntimeSubscriptions(): void {
    for (const off of this.#offs) off();
    this.#offs = [];
  }

  /** Capture the current load epoch; the returned probe is true while this
   *  load pass is still current (no unload/reload superseded it). */
  protected loadGuard(): () => boolean {
    const epoch = this._rootScNode.loadEpoch;
    return () => this._rootScNode.loadEpoch === epoch;
  }

  /** The element's own load step — the SYNCHRONOUS prefix wiring the
   *  runtime props: drop stale subscriptions first (re-entrant reconnect
   *  reload — or it would double-register), then per prop compute the
   *  initial value (the targets are earlier in DOM order, so their `_state`
   *  has settled) and re-compute on every target statechange. Subclasses
   *  that park their own subscriptions rely on this prefix running before
   *  their wiring — they start `super.load()` FIRST and await it last (see
   *  ScState/ScInput); ScParent adds the sequential walk over the parsed
   *  children. Synchronous at this level — Promise-typed for the overrides
   *  that genuinely await. */
  load(): Promise<void> {
    this.#dropRuntimeSubscriptions();
    for (const [name, prop] of Object.entries(this.runtimeProps ?? {})) {
      const recompute = () => {
        const v = this.#computeRuntime(prop);
        if (v !== undefined) this.updateRuntimeValue(name, v);
      };
      recompute();
      for (const target of Object.values(prop.targets)) {
        this.#offs.push(target.onStateChange(recompute));
      }
    }
    return Promise.resolve();
  }

  /** Undo the load pass (plugin unmount): drop the runtime-prop
   *  subscriptions. ScParent prepends the reverse child walk. */
  unload(): void {
    this.#dropRuntimeSubscriptions();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#dropRuntimeSubscriptions();
  }

}
