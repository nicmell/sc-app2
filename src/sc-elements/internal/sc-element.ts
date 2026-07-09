// The base of the parsed plugin elements — and the runtime itself: there is
// no separate item structure. The element IS the runtime — `process()`
// attaches the element to its parent's `_scChildren`, validates it, then
// resolves the runtime values and assigns them onto the component (declared
// here and on the category bases: internal/sc-node, sc-state, sc-input),
// recursing into the children (`processChildren`) where the per-element
// `resolveRuntime` says so. Bind targets must be declared BEFORE their
// references in the DOM (see CLAUDE.md — processing is headed for strict
// DOM order). The validation and bind-resolution helpers the `validate()`/
// `resolveRuntime` overrides build on live in internal/validation.ts.
// Declarative HTML attributes are NOT reactive properties — they are read on
// demand via `getProp`, coerced by the element's spec (the single source that
// also generates the XSD); only the handful of genuinely-reactive fields (a
// widget's `value`/`_checked`/…) stay as Lit properties. Runtime values are
// plain fields.
//
// RUNTIME PROPS: any spec attr flagged `runtime: true` accepts a `_`-prefixed
// sibling attribute holding a bind expression (`_min="vars.lo"`,
// `_value="osc.freq * 2"`, `_icon="s1.gate ? 'stop' : 'play'"`) — mutually
// exclusive with the static attribute. `process()` resolves each into live
// targets (+ parsed expression); `load()` computes the initial value and
// recomputes on every target's statechange, feeding `getProp` (and, for the
// `value` prop, the state elements' `_state` + the "statechange" event that
// notifies dependents). Element-to-element push propagation — the bind-order
// constraint makes the target graph a DAG resolved in DOM order, so the
// initial load settles in one pass; diamond dependencies can transiently
// dispatch once per intermediate before converging — accepted, each hop is
// Object.is-guarded.
//
// Still unported (return with their migration steps): the buffer family
// (sc-buffer/waveform/test + the old buffer-bound scope), presets/overrides.

import { LitElement } from "lit";
import { evalExpr } from "@/lib/utils/expression";
import { isNodeType } from "@/lib/utils/guards";
import { randomId } from "@/lib/utils/randomId";
import {
  baseRuntime,
  checkDuplicateNames,
  failValidation,
  isTransparent,
  nameOf,
  resolveStateBind,
} from "@/sc-elements/internal/validation";
import { SPECS } from "@/sc-elements/internal/xsd/registry";
import type { AttrSpec, ElementSpec } from "@/sc-elements/internal/xsd/types";
import type { BaseRuntime, RuntimeContext, RuntimeProp, StateValue } from "@/types/runtime";

/** A parent element — its parsed sc-* children live in `_scChildren`. */
export type ScParentElement = ScElement & { _scChildren: ScElement[] };

export abstract class ScElement extends LitElement implements BaseRuntime {
  // ── Runtime values (assigned by `process`; plain fields, not reactive) ──

  /** The hydrated identity — the native DOM id; `process` assigns one where
   *  none exists yet (the browser reflects it to the attribute). */
  declare id: string;
  /** The plugin root element this element was parsed under. */
  _rootScNode!: ScElement;
  /** The parsed parent element (unset at the root). */
  _parentScNode?: ScParentElement;
  /** The parsed sc-* child elements — parents only (NOT the DOM children:
   *  sc-* descendants reached through plain HTML wrappers). */
  _scChildren?: ScElement[];
  /** The named ancestor path (scope names, outermost first). */
  path: string[] = [];
  enabled = true;
  /** The load-pass epoch — only the plugin ROOT's counts. Bumped by the
   *  root's unload()/reload(), it invalidates a suspended load pass: the
   *  sequential walk re-checks it after every awaited child and aborts when
   *  it moved (disconnect unload, or a newer pass superseding this one). */
  loadEpoch = 0;
  /** The resolved runtime props (`_min="vars.lo"` → key "min"): live bind
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

  /** This element's spec (its colocated `<tag>.spec.ts`) — the single source
   *  for its declarative attribute contract. `getProp`/`validateProps` read it. */
  get spec(): ElementSpec | undefined {
    return SPECS.get(this.tagName.toLowerCase());
  }

  /** Read a declarative attribute, coerced per the spec. UNTYPED — cast at the
   *  call site (`this.getProp("min") as number`). Absent → undefined; a
   *  forwarded prop then falls back to the base widget's own default. When the
   *  attr is runtime-flagged and its `_attr` is present, this returns the LIVE
   *  evaluated value instead (undefined until the targets settle) — reads from
   *  render() re-run on every recompute. The genuinely-reactive fields (a
   *  widget's `value`, `_checked`, …) are NOT declarative attributes and stay
   *  as reactive class fields. */
  getProp(name: string): string | number | boolean | undefined {
    const attr = this.spec?.attrs?.[name];
    if (attr?.runtime && this.hasAttribute(`_${name}`)) {
      return this.coerceProp(attr, this.#runtime[name], true);
    }
    const raw = this.getAttribute(name);
    if (raw === null) return undefined;
    return this.coerceProp(attr, raw, false);
  }

  /** Coerce a raw attribute string or an evaluated runtime value per the spec
   *  type: decimal/integer → Number, boolean → `!== "false"` for the static
   *  attribute (run/disabled) and plain truthiness for evaluated values (an
   *  evaluated `''`/0 is falsy), scalar → number-if-numeric-else-string,
   *  string/enum → String. */
  private coerceProp(
    attr: AttrSpec | undefined,
    value: StateValue | undefined,
    evaluated: boolean,
  ): string | number | boolean | undefined {
    if (value === undefined) return undefined;
    if (attr?.type === "decimal" || attr?.type === "integer") return Number(value);
    if (attr?.type === "boolean") {
      return evaluated ? Boolean(value) : value !== "false";
    }
    if (attr?.type === "scalar") {
      if (typeof value === "number") return value;
      const n = Number(value);
      return value.trim() !== "" && !Number.isNaN(n) ? n : value;
    }
    return String(value); // string / enum
  }

  /** Spec-driven attribute validation, run before `validate()`: required
   *  present (a runtime attr satisfies it with either form), static/`_`
   *  mutual exclusion, numeric non-NaN, enum membership, and no stray
   *  `_`-attrs (only runtime-flagged spec attrs have a `_` form).
   *  Element-specific semantic and range rules (name syntax, positive/≤max,
   *  no-sc-children) stay in the per-element `validate()` override. */
  validateProps(): void {
    const attrs = this.spec?.attrs ?? {};
    for (const [name, attr] of Object.entries(attrs)) {
      const raw = this.getAttribute(name);
      const dynamic = attr.runtime ? this.getAttribute(`_${name}`) : null;
      if (raw !== null && dynamic !== null) {
        failValidation(this, `"${name}" and "_${name}" are mutually exclusive`);
      }
      if (raw === null) {
        if (attr.required && dynamic === null) {
          failValidation(this, `missing required "${name}" attribute`);
        }
        continue;
      }
      if ((attr.type === "decimal" || attr.type === "integer") && Number.isNaN(Number(raw))) {
        failValidation(this, `"${name}" attribute must be a number`);
      }
      if (attr.type === "enum" && !attr.values.includes(raw)) {
        failValidation(this, `"${name}" attribute must be one of ${attr.values.join("|")} (got "${raw}")`);
      }
    }
    for (const { name } of Array.from(this.attributes)) {
      if (name.startsWith("_") && !attrs[name.slice(1)]?.runtime) {
        failValidation(this, `unknown runtime attribute "${name}"`);
      }
    }
  }

  /** Per-element SEMANTIC validation (value-XOR-bind, name syntax, ranges, …),
   *  run after `validateProps`. A violation fails the whole plugin parse. */
  validate(): void {}

  // ── The parse engine ────────────────────────────────────────────────────

  /** Hydrate this element: assign the parsed identity (the registry keys by
   *  it; the root arrives with the box id instead). */
  hydrate(id: string): this {
    this.id = id;
    return this;
  }

  /** Process this hydrated element: pre-register it (so re-entrant resolves
   *  of a mid-processing ancestor return it), attach it to its TRUE parse
   *  parent's `_scChildren` (the transparent container — sc-if/sc-select/… —
   *  for elements inside one; the level owner otherwise), run the element's
   *  own `validate()`, then resolve the runtime values and assign them onto
   *  the element. `ctx.parentNode` stays the level OWNER throughout
   *  resolution (enablement/path/bindless defaults read the named parent);
   *  `_parentScNode` is corrected to the parse parent afterwards, keeping
   *  the runtime tree truthful. Idempotent — an already-processed element is
   *  returned as-is. */
  process(ctx: RuntimeContext): ScElement {
    if (ctx.nodes.has(this)) {
      return this;
    }
    ctx.nodes.add(this);
    if (!this.id) this.id = randomId();
    const parent = ctx.parentNode && this.parseParentOf(ctx.parentNode);
    if (parent) {
      ((parent as ScElement)._scChildren ??= []).push(this);
    }
    this.validateProps();
    this.validate();
    Object.assign(this, this.resolveRuntime(ctx));
    this.resolveRuntimeProps(ctx);
    if (parent) this._parentScNode = parent;
    return this;
  }

  /** Resolve every present `_attr` into live targets + expression — the same
   *  machinery state binds use, so the bind-order constraint applies. Runs
   *  AFTER `resolveRuntime` (enablement is known): a `_attr` on a DISABLED
   *  element (a graph input inside synthdefs/ugens) is rejected loudly — it
   *  has no node scope to resolve against, and the graph collectors read the
   *  static attributes only. */
  private resolveRuntimeProps(ctx: RuntimeContext): void {
    this.runtimeProps = undefined; // a re-process must not keep stale binds
    for (const [name, attr] of Object.entries(this.spec?.attrs ?? {})) {
      if (!attr.runtime) continue;
      const expr = this.getAttribute(`_${name}`);
      if (expr === null) continue;
      if (!this.enabled) {
        failValidation(this, `"_${name}" is not allowed on a synthdef graph input`);
      }
      (this.runtimeProps ??= {})[name] = resolveStateBind(this, ctx, expr, `_${name}`);
    }
  }

  /** The element's true parse parent: its nearest sc ancestor within the
   *  level. Direct and HTML-wrapped children resolve to the level owner;
   *  elements inside a transparent container resolve to that container. */
  private parseParentOf(level: ScParentElement): ScParentElement {
    for (let p = this.parentElement; p && p !== level; p = p.parentElement) {
      if (isNodeType(p.tagName.toLowerCase())) return p as ScElement as ScParentElement;
    }
    return level;
  }

  /** The nearest non-transparent sc ancestor — the element's effective owner
   *  (an element inside an sc-if belongs to the enclosing node). */
  get namedScParent(): ScParentElement | undefined {
    let p = this._parentScNode;
    while (p && isTransparent(p)) p = p._parentScNode;
    return p;
  }

  /** Resolve this element's runtime values — bind resolution lives here, on
   *  each component (over the internal/validation machinery). The default is
   *  the self-contained leaf (sc-console / sc-scope / sc-strudel). */
  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    return baseRuntime(ctx);
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
   *  precedes its dependents' recomputes), then, for the `value` prop (the
   *  one dependents can bind to), dispatches the non-bubbling "statechange".
   *  Never call from willUpdate/render (it schedules an update). */
  protected updateRuntimeValue(name: string, next: StateValue): void {
    const prev = this.#runtime[name];
    if (Object.is(prev, next)) return;
    this.#runtime[name] = next;
    this.requestUpdate();
    this.runtimeValueChanged(name, prev, next);
    if (name === "value") {
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
   *  expression (a plain single-path bind is the identity). `undefined` when
   *  any target has no value yet — evaluating would push NaN downstream. */
  #computeRuntime(prop: RuntimeProp): StateValue | undefined {
    const values: Record<string, StateValue> = {};
    for (const [path, target] of Object.entries(prop.targets)) {
      const v = target._state;
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
    const epoch = this._rootScNode?.loadEpoch ?? 0;
    for (const child of this._scChildren ?? []) {
      await child.load();
      if ((this._rootScNode?.loadEpoch ?? 0) !== epoch) return; // pass invalidated mid-await
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

  /** Recurse into this parent's children: hydrate EVERY child first — the
   *  full sibling scope (including transparent containers' contents) goes
   *  into the level context BEFORE any child processes, and duplicate names
   *  are checked across the whole scope up front — then reset this parent's
   *  `_scChildren` and process each child in document order (each attaches
   *  itself to its true parse parent). All siblings share ONE level context;
   *  `process` recurses per child. Only naming containers (and the root) run
   *  this — transparent containers never open a level. */
  protected processChildren(ctx: RuntimeContext): void {
    const name = nameOf(this);
    const path = name ? [...ctx.path, name] : ctx.path;

    const scope = [...this.walkScElements()].map((el) => el.hydrate(randomId()));

    checkDuplicateNames(scope);

    this._scChildren = [];
    const childCtx: RuntimeContext = {
      ...ctx,
      scope: [...scope, ...ctx.scope],
      parentNode: this as ScElement as ScParentElement,
      path,
    };
    for (const child of scope) {
      child.process(childCtx);
    }
  }
}
