// The base of the parsed plugin elements — and the runtime itself: there is
// no separate item structure. The element IS the runtime — `process()`
// attaches the element to its parent's `_scChildren`, assigns the shared
// core, then runs the TWO conceptual steps every component can extend
// through `super`: `validate(ctx)` (static — the spec gate + the recursion
// into sc children) and `resolveRuntime(ctx)` (runtime — bind/reference
// resolution; the runtime values are plain fields declared here and on the
// category bases: internal/sc-node, sc-state, sc-input). Bind targets must
// be declared BEFORE their references in the DOM (see CLAUDE.md —
// processing is strict DOM order). The validation and bind-resolution
// helpers the two steps build on live in internal/validation.ts.
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
import { isNodeRuntime, isNodeType, isStateRuntime } from "@/lib/utils/guards";
import { contentHash } from "@/sc-elements/internal/contentHash";
import {
  checkDuplicateNames,
  coerceScalar,
  coerceVector,
  coerceStatic,
  isTransparent,
  nameOf,
  resolveStateBind,
  validateProps,
} from "@/sc-elements/internal/validation";
import { SPECS } from "@/sc-elements/internal/xsd/registry";
import { bindAttr, type AttrSpec, type ElementSpec } from "@/sc-elements/internal/xsd/types";
import type { RuntimeContext, RuntimeProp, StateValue } from "@/types/runtime";

/** A bind path's numeric SLOT tail (`env.5` → 5), or null for plain paths —
 *  names cannot start with a digit, so the tail is unambiguous. */
export function slotIndexOf(path: string): number | null {
  const tail = path.slice(path.lastIndexOf(".") + 1);
  return path.includes(".") && /^\d+$/.test(tail) ? Number(tail) : null;
}

/** A parent element — its parsed sc-* children live in `_scChildren`. */
export type ScParentElement = ScElement & { _scChildren: ScElement[] };

export abstract class ScElement extends LitElement {
  // ── Runtime values (assigned by `process`; plain fields, not reactive) ──

  /** The parsed identity — the native DOM id; `process` mints the
   *  path-chained hash (the browser reflects it to the attribute). */
  declare id: string;
  /** The plugin root element this element was parsed under. */
  _rootScNode!: ScElement;
  /** The parsed parent element (unset at the root). */
  _parentScNode?: ScParentElement;
  /** The parsed sc-* child elements — parents only (NOT the DOM children:
   *  sc-* descendants reached through plain HTML wrappers). */
  _scChildren?: ScElement[];
  /** The named ancestor path (scope names, outermost first). */
  basePath: string[] = [];
  /** The load-pass epoch — only the plugin ROOT's counts. Bumped by the
   *  root's unload()/reload(), it invalidates a suspended load pass: the
   *  sequential walk re-checks it after every awaited child and aborts when
   *  it moved (disconnect unload, or a newer pass superseding this one). */
  loadEpoch = 0;
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
      return Boolean(value);
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

  /** STEP 1 — static validation: the spec-driven attribute gate, then the
   *  recursion into the sc children (data-driven: only non-transparent
   *  elements whose content model admits sc children open a level — leaves
   *  keep `_scChildren` undefined). Overrides add their SEMANTIC rules
   *  (cross-attribute, positional) and MUST call `super.validate(ctx)` —
   *  rules placed before it run pre-children, after it post-children. A
   *  violation fails the whole plugin parse. */
  validate(ctx: RuntimeContext): void {
    validateProps(this);
    if (!isTransparent(this) && this.spec?.content?.choice?.length) {
      this.processChildren(ctx);
    }
  }

  // ── The parse engine ────────────────────────────────────────────────────

  /** Process this element: mint its path-chained hash DOM identity (the
   *  level owner's id + the level's document-order counter), pre-register it
   *  (so re-entrant resolves of a mid-processing ancestor return it), attach
   *  to its owning parent (`processParent`), assign the shared runtime core
   *  (`_rootScNode`/`basePath`), then run the TWO conceptual steps —
   *  `validate(ctx)` (static: the spec gate + the recursion into sc
   *  children) and `resolveRuntime(ctx)` (runtime: bind/reference
   *  resolution) — both extendable per element THROUGH `super`.
   *  `ctx.parentNode` stays the level OWNER throughout (path/bindless
   *  defaults read the named parent) — `_parentScNode` carries the parse
   *  parent, keeping the runtime tree truthful. Library throws get the
   *  canonical `<tag>:` prefix; already-shaped errors pass through.
   *  Idempotent — an already-processed element is returned as-is. */
  process(ctx: RuntimeContext): ScElement {
    if (ctx.nodes.has(this)) {
      return this;
    }
    ctx.nodes.add(this);
    this.id = contentHash(this, ctx.parentNode?.id ?? "", ctx.index++);
    this.processParent(ctx);
    try {
      this._rootScNode = ctx.rootNode;
      this.basePath = ctx.path;
      this.validate(ctx);
      this.resolveRuntime(ctx);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (e instanceof Error && message.startsWith("<")) throw e;
      throw new Error(`<${this.tagName.toLowerCase()}>: ${message}`, { cause: e });
    }
    return this;
  }

  /** Attach this element to its parent — the nearest NON-TRANSPARENT sc
   *  ancestor within the level (transparent containers — sc-if/sc-select/… —
   *  are walked through, so their contents belong directly to the enclosing
   *  node; transparent containers themselves stay runtime-tree leaves) —
   *  pushing it onto the parent's `_scChildren` and setting `_parentScNode`
   *  (owned HERE — resolution never touches it). The root has no parent and
   *  skips both. */
  private processParent(ctx: RuntimeContext): void {
    const level = ctx.parentNode;
    if (!level) return;
    let parent = level;
    for (let p = this.parentElement; p && p !== level; p = p.parentElement) {
      if (isNodeType(p.tagName.toLowerCase()) && !isTransparent(p)) {
        parent = p as ScElement as ScParentElement;
        break;
      }
    }
    (parent._scChildren ??= []).push(this);
    this._parentScNode = parent;
  }

  /** STEP 2 — runtime resolution: every present `bind:attr` becomes live
   *  targets + expression (the same machinery state binds use, so the
   *  bind-order constraint applies). The SYNTHDEF PLANE is skipped wholesale
   *  (a non-node level exists only inside sc-synthdef/sc-ugen): there a
   *  `bind:value` is a raw GRAPH reference the synthdef collectors consume —
   *  never resolved on the state graph; the loud on-a-param rejection is
   *  ScSynthDef's. Overrides add their element-specific resolution
   *  (references, graph collection, resolved-state rules — the children are
   *  already parsed) and MUST call `super.resolveRuntime(ctx)`. */
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
    const epoch = this._rootScNode?.loadEpoch ?? 0;
    return () => (this._rootScNode?.loadEpoch ?? 0) === epoch;
  }

  /** The async load pass, run AFTER the sync parse, in strict DOM order: a
   *  parent awaits each child fully before the next starts — no concurrency,
   *  no reactive gates. The bind-order constraint (targets declared before
   *  their references) makes DOM order a valid dependency order, so a
   *  synthdef's /d_recv is acknowledged before its synth's /s_new is sent.
   *  Overrides sequence their own OSC and call `super.load()` where the
   *  children follow.
   *
   *  The SYNCHRONOUS prefix wires the runtime props: drop stale
   *  subscriptions first (re-entrant reconnect reload — or it would
   *  double-register), then per prop compute the initial value (the targets
   *  are earlier in DOM order, so their `_state` has settled) and re-compute
   *  on every target statechange. Subclasses that park their own
   *  subscriptions rely on this prefix running before their wiring — they
   *  start `super.load()` FIRST and await it last (see ScState/ScInput). */
  async load(): Promise<void> {
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
    const live = this.loadGuard();
    for (const child of this._scChildren ?? []) {
      await child.load();
      if (!live()) return; // pass invalidated mid-await
    }
  }

  /** Undo the load pass (plugin unmount). Sends are fire-and-forget — no
   *  replies awaited; children unload in REVERSE DOM order so dependents go
   *  before their targets. */
  unload(): void {
    for (const child of [...(this._scChildren ?? [])].reverse()) {
      child.unload();
    }
    this.#dropRuntimeSubscriptions();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#dropRuntimeSubscriptions();
  }

  /** This element's sc-* descendants, recursing through plain HTML wrappers
   *  AND through transparent (nameless) sc containers — those are yielded
   *  too, before their contents, so ONE flat level covers an sc-if's whole
   *  subtree (its contents live in the enclosing scope: same duplicate
   *  check, same bind scope, same store paths — unconditionally, since
   *  sc-if only hides visually). Nameless leaves have no sc children at
   *  parse time, so descending into them is a no-op. */
  *walkScElements(el: Element = this): Generator<ScElement> {
    for (const child of Array.from(el.children)) {
      if (isNodeType(child.tagName.toLowerCase())) {
        yield child as ScElement;
        if (isTransparent(child)) yield* this.walkScElements(child);
      } else {
        yield* this.walkScElements(child);
      }
    }
  }

  /** Recurse into this parent's children: collect the full sibling scope
   *  (including transparent containers' contents) into the level context and
   *  check duplicate names across it BEFORE any child processes — then reset
   *  this parent's `_scChildren` and process each child in document order
   *  (each mints its id and attaches itself to its owning parent). All
   *  siblings share ONE level context; `process` recurses per child. Called
   *  by the base `validate(ctx)` for the level-opening elements only —
   *  transparent containers and leaves never open a level. */
  private processChildren(ctx: RuntimeContext): void {
    const name = nameOf(this);
    const path = name ? [...ctx.path, name] : ctx.path;

    const scope = [...this.walkScElements()];

    checkDuplicateNames(scope);

    this._scChildren = [];
    const childCtx: RuntimeContext = {
      ...ctx,
      scope: [...scope, ...ctx.scope],
      parentNode: this as ScElement as ScParentElement,
      path,
      index: 0,
    };
    for (const child of scope) {
      child.process(childCtx);
    }
  }
}
