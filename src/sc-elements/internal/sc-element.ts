// The base of the parsed plugin elements — and the runtime itself: there is
// no separate item structure. The element IS the runtime — `process()`
// attaches the element to its parent's `_scChildren`, validates it, then
// resolves the runtime values and assigns them onto the component (declared
// here and on the category bases: internal/sc-node, sc-state, sc-input),
// recursing into the children (`processChildren`) where the per-element
// `resolveRuntime` says so. Bind targets must be declared BEFORE their
// references in the DOM (see CLAUDE.md — processing is headed for strict
// DOM order). The validation and bind-resolution helpers the `validate()`/
// `resolveRuntime` overrides build on live in internal/validation.ts. HTML
// attributes are reactive properties; runtime values are plain fields. Still
// unported (return with their migration steps): the buffer family
// (sc-buffer/waveform/test + the old buffer-bound scope), presets/overrides,
// and synthdef compilation.

import { LitElement } from "lit";
import { isNodeType } from "@/lib/utils/guards";
import { randomId } from "@/lib/utils/randomId";
import {
  baseRuntime,
  checkDuplicateNames,
  isTransparent,
  nameOf,
} from "@/sc-elements/internal/validation";
import type { BaseRuntime, RuntimeContext } from "@/types/runtime";

/** `run="false"` is the only falsy spelling (bare/`run="true"` mean running). */
export const runAttribute = {
  converter: { fromAttribute: (value: string | null) => value !== "false" },
};

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

  /** Render into the light DOM so plugin markup children stay visible. */
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  /** Per-element attribute validation, called during hydration — a violation
   *  fails the whole plugin parse. The backend XSD validates structure at
   *  upload, but it does not enforce attribute requirements, so this is the
   *  real gate. Colocate the rules with the property declarations in each
   *  component, building on the internal/validation helpers. */
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
    this.validate();
    Object.assign(this, this.resolveRuntime(ctx));
    if (parent) this._parentScNode = parent;
    return this;
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

  /** The async load pass, run AFTER the sync parse, in strict DOM order: a
   *  parent awaits each child fully before the next starts — no concurrency,
   *  no reactive gates. The bind-order constraint (targets declared before
   *  their references) makes DOM order a valid dependency order, so a
   *  synthdef's /d_recv is acknowledged before its synth's /s_new is sent.
   *  Overrides sequence their own OSC and call `super.load()` where the
   *  children follow. */
  async load(): Promise<void> {
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
