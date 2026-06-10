// The base of the parsed plugin elements — and the runtime itself: there is
// no separate item structure. The element IS the runtime — `process()`
// resolves the runtime values and assigns them onto the component (declared
// here and on the category bases: internal/sc-node, sc-state, sc-input), and
// the runtime registry maps ids straight to the live elements. The base
// carries the parse engine — `hydrate` (id + validate), `process` (the
// per-element skeleton: idempotence, pre-registration, runtime merge),
// `processChildren` (the recursive DOM walk with cumulative scopes); the
// validation and bind-resolution helpers the `validate()`/`resolveRuntime`
// overrides build on live in internal/validation.ts. HTML attributes are
// reactive properties; runtime values are plain fields. Still unported
// (return with their migration steps): the buffer family (sc-buffer/waveform/
// test + the old buffer-bound scope), presets/overrides, and synthdef
// compilation.

import { LitElement } from "lit";
import { isNodeType, isParentRuntime } from "@/lib/utils/guards";
import { randomId } from "@/lib/utils/randomId";
import { getById } from "@/runtime/registry";
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

  /** The hydrated identity — the native DOM id; `hydrate` assigns it (and
   *  the browser reflects it to the attribute). */
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

  /** Hydrate this element: assign the id, run the element's own `validate()`,
   *  and reset the parsed-children list (parents). */
  hydrate(id: string): this {
    this.id = id;
    this.validate();
    if (isParentRuntime(this)) this._scChildren = [];
    return this;
  }

  /** Process this hydrated element: pre-register it (so re-entrant resolves
   *  of a mid-processing ancestor return it), attach it to the parent's
   *  `_scChildren`, resolve the runtime values, and assign them onto the
   *  element. Idempotent — an already-processed element is returned as-is. */
  process(ctx: RuntimeContext): ScElement {
    if (ctx.nodes.has(this)) {
      return this;
    }
    ctx.nodes.add(this);
    if (ctx.parentNode) {
      ctx.parentNode._scChildren.push(this);
    }
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
  protected *walkScElements(el: Element = this): Generator<ScElement> {
    for (const child of Array.from(el.children)) {
      if (isNodeType(child.tagName.toLowerCase())) {
        yield child as ScElement;
      } else {
        yield* this.walkScElements(child);
      }
    }
  }

  /** Parse this parent's children: hydrate (id + validate) EVERY child first
   *  — the full sibling scope must exist before any child resolves a bind
   *  (forward references), and duplicate names are checked across the whole
   *  scope — then process each with the cumulative scope. All siblings share
   *  ONE level context. */
  protected processChildren(ctx: RuntimeContext): void {
    const name = nameOf(this);
    const path = name ? [...ctx.path, name] : ctx.path;

    const scope = [...this.walkScElements()].map((el) => el.hydrate(randomId()));

    checkDuplicateNames(scope);

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

  // TEST: the registry must hand back THIS mounted component instance — i.e.
  // it gives access to the live web component (props, runtime values, and
  // methods) from outside the DOM. Deferred one task: the first render races
  // the parse/registerAll in the same microtask queue.
  protected firstUpdated(): void {
    setTimeout(() => {
      const registered = getById(this.id);
      console.log(
        `[sc-element test] <${this.tagName.toLowerCase()} id="${this.id}">`,
        `registry element === this: ${registered === this}`,
        "| ctor:", registered?.constructor.name ?? "(not registered)",
        "| proto methods:", registered ? Object.getOwnPropertyNames(Object.getPrototypeOf(registered)) : null,
      );
    }, 0);
  }
}
