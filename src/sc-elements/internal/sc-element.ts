// The base of the parsed plugin elements — and the runtime itself: there is
// no separate item structure. The element IS the runtime — `process()`
// resolves the runtime values and assigns them onto the component (declared
// here and on the category bases: internal/sc-node, sc-state, sc-input), and
// the runtime registry maps ids straight to the live elements. The base also
// carries the parse engine — `hydrate` (id + validate), `process` (the
// per-element skeleton: idempotence, pre-registration, runtime merge),
// `processChildren` (the recursive DOM walk with cumulative scopes) — and the
// shared bind-resolution machinery the `resolveRuntime` overrides build on.
// HTML attributes are reactive properties; runtime values are plain fields.
// Still unported (return with their migration steps): the buffer family
// (sc-buffer/waveform/test + the old buffer-bound scope), presets/overrides,
// and synthdef compilation.

import { LitElement } from "lit";
import { ELEMENTS } from "@/constants/sc-elements";
import { parseBind } from "@/lib/utils/expression";
import { isNodeRuntime, isNodeType, isParentRuntime, isStateRuntime, typeOf } from "@/lib/utils/guards";
import { randomId } from "@/lib/utils/randomId";
import { getById } from "@/runtime/registry";
import type { BaseRuntime, Expr, InputRuntime, RuntimeContext } from "@/types/runtime";

const SC_ELEMENT_SELECTOR = Object.values(ELEMENTS).join(", ");

/** `run="false"` is the only falsy spelling (bare/`run="true"` mean running). */
export const runAttribute = {
  converter: { fromAttribute: (value: string | null) => value !== "false" },
};

/** A parent element — its parsed sc-* children live in `scChildren`. */
export type ScParentElement = ScElement & { scChildren: ScElement[] };

function nameOf(el: Element): string | undefined {
  return (el as { name?: string }).name;
}

function walkPath(node: ScElement, path: string[]): ScElement | undefined {
  if (path.length === 0) return node;
  if (node.scChildren) {
    const [name, ...rest] = path;
    const child = node.scChildren.find((c) => nameOf(c) === name);
    return child ? walkPath(child, rest) : undefined;
  }
  return undefined;
}

function checkDuplicateNames(scope: ScElement[]): void {
  const seen = new Set<string>();
  for (const el of scope) {
    const name = nameOf(el);
    if (name) {
      if (seen.has(name)) {
        throw new Error(`<${typeOf(el)} name="${name}">: duplicate name in scope`);
      }
      seen.add(name);
    }
  }
}

export abstract class ScElement extends LitElement implements BaseRuntime {
  // ── Runtime values (assigned by `process`; plain fields, not reactive) ──

  /** The plugin root's id this element was parsed under. */
  rootId = "";
  /** The parsed parent element's id ("" at the root). */
  parentId = "";
  /** The named ancestor path (scope names, outermost first). */
  path: string[] = [];
  enabled = true;
  /** The parsed sc-* child elements — parents only (NOT the DOM children:
   *  sc-* descendants reached through plain HTML wrappers). */
  scChildren?: ScElement[];

  /** Render into the light DOM so plugin markup children stay visible. */
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  /** Per-element attribute validation, called during hydration — a violation
   *  fails the whole plugin parse. The backend XSD validates structure at
   *  upload, but it does not enforce attribute requirements, so this is the
   *  real gate. Colocate the rules with the property declarations in each
   *  component. */
  validate(): void {}

  /** Throw a validation error in the canonical `<tag>: message` shape. */
  protected failValidation(message: string): never {
    throw new Error(`<${this.tagName.toLowerCase()}>: ${message}`);
  }

  /** Leaves must not nest other sc-* elements. (Plain DOM children are fine:
   *  an upgraded element has already rendered its own UI into itself.) */
  protected requireNoScChildren(): void {
    if (this.querySelector(SC_ELEMENT_SELECTOR)) this.failValidation("must not contain sc-* elements");
  }

  /** Require a non-empty reactive property (backing a required attribute). */
  protected requireProp(name: string, value: string): void {
    if (!value) this.failValidation(`missing required "${name}" attribute`);
  }

  /** Reject a numeric property whose attribute didn't parse as a number. */
  protected requireNumeric(name: string, value: number | undefined): void {
    if (value !== undefined && Number.isNaN(value)) {
      this.failValidation(`"${name}" attribute must be a number`);
    }
  }

  // ── The parse engine ────────────────────────────────────────────────────

  /** Hydrate this element: assign the id, run the element's own `validate()`,
   *  and reset the parsed-children list (parents). */
  hydrate(id: string): this {
    this.setAttribute("id", id);
    this.validate();
    if (isParentRuntime(this)) this.scChildren = [];
    return this;
  }

  /** Process this hydrated element: pre-register it (so re-entrant resolves
   *  of a mid-processing ancestor return it), attach it to the parent's
   *  `scChildren`, resolve the runtime values, and assign them onto the
   *  element. Idempotent — an already-processed element is returned as-is. */
  process(ctx: RuntimeContext): ScElement {
    const existing = ctx.nodes.get(this.id);
    if (existing) {
      return existing;
    }
    ctx.nodes.set(this.id, this);
    if (ctx.parentNode) {
      ctx.parentNode.scChildren.push(this);
    }
    Object.assign(this, this.resolveRuntime(ctx));
    return this;
  }

  /** Resolve this element's runtime values — bind resolution lives here, on
   *  each component. The default is the self-contained leaf (sc-console /
   *  sc-scope / sc-strudel). */
  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    return this.baseRuntime(ctx);
  }

  /** The runtime core every element shares. */
  protected baseRuntime(ctx: RuntimeContext): BaseRuntime {
    return { rootId: ctx.rootId, parentId: ctx.parentNode?.id ?? "", path: ctx.path, enabled: true };
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

  // ── Shared bind-resolution machinery ────────────────────────────────────

  /** Resolve a name path against the scope, processing the target on demand
   *  (forward references). */
  protected resolveNode(ctx: RuntimeContext, path: string[]): ScElement | undefined {
    const [name, ...rest] = path;
    const el = ctx.scope.find((s) => nameOf(s) === name);
    if (!el) return undefined;

    const target = ctx.nodes.get(el.id) ?? el.process(ctx);

    return walkPath(target, rest);
  }

  /** Resolve `bind`'s node + control-name pair: the leading segments name a
   *  node in scope (none targets the parent node), the last segment a state
   *  child declared on it. */
  protected resolveControlBind(ctx: RuntimeContext, bind: string): { target: ScElement; controlName: string } {
    const tag = this.tagName.toLowerCase();
    const segments = bind.split(".");
    const controlName = segments.pop()!;
    const target = segments.length > 0 ? this.resolveNode(ctx, segments) : ctx.parentNode;
    if (!target || !isNodeRuntime(target)) {
      throw new Error(`<${tag} bind="${bind}">: does not match any node in scope`);
    }
    if (!target.scChildren?.some((c) => isStateRuntime(c) && nameOf(c) === controlName)) {
      const targetName = nameOf(target) ?? target.id;
      throw new Error(
        `<${tag} bind="${bind}">: control "${controlName}" is not declared on <${typeOf(target)} name="${targetName}">`,
      );
    }
    return { target, controlName };
  }

  /** Resolve a stateful bind (an enabled sc-control / sc-var referencing other
   *  controls/vars): plain dot-paths or an arithmetic expression over them. */
  protected resolveStateBind(ctx: RuntimeContext, bind: string): { targets: Record<string, string>; expression?: Expr } {
    const parsed = parseBind(bind);
    const targets: Record<string, string> = {};

    for (const path of parsed.paths) {
      const { target, controlName } = this.resolveControlBind(ctx, path);
      const targetState = target.scChildren!.find((c) => isStateRuntime(c) && nameOf(c) === controlName)!;
      this.checkCircularBind(ctx, targetState.id);
      targets[path] = targetState.id;
    }

    return { targets, expression: parsed.expression };
  }

  protected checkCircularBind(ctx: RuntimeContext, targetId: string): void {
    const visited = new Set<string>([this.id]);
    const queue = [targetId];
    while (queue.length > 0) {
      const current = queue.pop()!;
      if (visited.has(current)) {
        const name = (this as { name?: string }).name;
        throw new Error(`<${this.tagName.toLowerCase()} name="${name}">: circular bind reference detected`);
      }
      visited.add(current);
      const node = ctx.nodes.get(current);
      if (!node || !isStateRuntime(node)) continue;
      // The runtime values are still unassigned on a state element that's
      // mid-processing (we got here through its own bind resolve) — its
      // targets aren't known yet, but the cycle is still caught from the
      // other end once they are.
      if (node.targets) queue.push(...Object.values(node.targets));
    }
  }

  /** Resolve a visual/input bind to its target state element's id. */
  protected resolveVisualBind(ctx: RuntimeContext, bind: string): InputRuntime {
    const { target, controlName } = this.resolveControlBind(ctx, bind);
    const control = target.scChildren!.find((c) => isStateRuntime(c) && nameOf(c) === controlName)!;
    return { ...this.baseRuntime(ctx), targetId: control.id };
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
