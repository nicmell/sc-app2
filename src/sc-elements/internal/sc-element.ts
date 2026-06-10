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
import { baseRuntime, checkDuplicateNames, nameOf } from "@/sc-elements/internal/validation";
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
   *  of a mid-processing ancestor return it), attach it to the parent's
   *  `_scChildren`, run the element's own `validate()`, then resolve the
   *  runtime values and assign them onto the element. Idempotent — an
   *  already-processed element is returned as-is. */
  process(ctx: RuntimeContext): ScElement {
    if (ctx.nodes.has(this)) {
      return this;
    }
    ctx.nodes.add(this);
    if (!this.id) this.id = randomId();
    if (ctx.parentNode) {
      ctx.parentNode._scChildren.push(this);
    }
    this.validate();
    Object.assign(this, this.resolveRuntime(ctx));
    return this;
  }

  /** Resolve this element's runtime values — bind resolution lives here, on
   *  each component (over the internal/validation machinery). The default is
   *  the self-contained leaf (sc-console / sc-scope / sc-strudel). */
  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    return baseRuntime(ctx);
  }

  /** This element's sc-* descendants, recursing through plain HTML. */
  *walkScElements(el: Element = this): Generator<ScElement> {
    for (const child of Array.from(el.children)) {
      if (isNodeType(child.tagName.toLowerCase())) {
        yield child as ScElement;
      } else {
        yield* this.walkScElements(child);
      }
    }
  }

  /** Recurse into this parent's children: hydrate EVERY child first — the
   *  full sibling scope goes into the level context BEFORE any child
   *  processes, and duplicate names are checked across the whole scope up
   *  front — then reset this parent's `_scChildren` and process each child
   *  (each attaches itself). All siblings share ONE level context; `process`
   *  recurses per child. */
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
