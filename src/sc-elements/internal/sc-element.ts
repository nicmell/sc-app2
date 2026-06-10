// The base of the parsed plugin elements — and the runtime processor itself
// (ported from the old sc-app's lib/runtime/handlers, moved onto the
// components): light-DOM rendering, a lookup of the parsed item this element
// was hydrated into, the per-element validation hook, and the parse engine —
// `hydrate` (id + validate + bare item), `process` (the per-item skeleton:
// idempotence, pre-registration, flat runtime merge), `processChildren` (the
// recursive DOM walk with cumulative scopes), and the shared bind-resolution
// machinery the `resolveRuntime` overrides build on. Each element type
// overrides `resolveRuntime` to resolve its own binds and return its runtime
// values; the HTML attributes are its own reactive properties. Still unported
// (return with their migration steps): the buffer family (sc-buffer/waveform/
// test + the old buffer-bound scope), presets/overrides, and synthdef
// compilation.

import { LitElement } from "lit";
import { ELEMENTS } from "@/constants/sc-elements";
import { parseBind } from "@/lib/utils/expression";
import { isNodeRuntime, isNodeType, isParentRuntime, isStateRuntime, typeOf } from "@/lib/utils/guards";
import { randomId } from "@/lib/utils/randomId";
import { getById } from "@/runtime/registry";
import type {
  BaseRuntime,
  Expr,
  InputRuntime,
  NodeRuntime,
  RuntimeContext,
  ScElementRuntime,
  ScElementRuntimeBase,
  ScParentRuntime,
} from "@/types/runtime";

const SC_ELEMENT_SELECTOR = Object.values(ELEMENTS).join(", ");

/** `run="false"` is the only falsy spelling (bare/`run="true"` mean running). */
export const runAttribute = {
  converter: { fromAttribute: (value: string | null) => value !== "false" },
};

function nameOf(el: ScElementRuntimeBase): string | undefined {
  return (el._element as { name?: string }).name;
}

function walkPath(node: ScElementRuntime, path: string[]): ScElementRuntime | undefined {
  if (path.length === 0) return node;
  if (isParentRuntime(node)) {
    const [name, ...rest] = path;
    const child = node.children.find((c) => nameOf(c) === name);
    return child ? walkPath(child, rest) : undefined;
  }
  return undefined;
}

function checkDuplicateNames(scope: ScElementRuntimeBase[]): void {
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

export abstract class ScElement<T extends ScElementRuntime = ScElementRuntime> extends LitElement {
  /** Render into the light DOM so plugin markup children stay visible. */
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  /** The parsed item this element was hydrated into (`hydrate` assigns the
   *  matching DOM id), or `null` before the plugin root has parsed. */
  get item(): T | null {
    return (getById(this.id) as T | undefined) ?? null;
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

  /** Hydrate this element into its bare runtime item: assign the id, run the
   *  element's own `validate()`, and tie the item to the component. */
  hydrate(id: string): ScElementRuntimeBase {
    this.setAttribute("id", id);
    this.validate();
    const item: ScElementRuntimeBase = { id, _element: this };
    if (isParentRuntime(item)) (item as ScParentRuntime).children = [];
    return item;
  }

  /** Process this element's hydrated item (`ctx.tree`): pre-register it (so
   *  re-entrant resolves of a mid-processing ancestor return it), attach it
   *  to the parent, resolve the runtime values, and merge them flat into the
   *  item. Idempotent — an already-processed item is returned as-is. */
  process(ctx: RuntimeContext): ScElementRuntime {
    const existing = ctx.nodes.get(ctx.tree.id);
    if (existing) {
      return existing;
    }
    const node = ctx.tree as unknown as ScElementRuntime;
    ctx.nodes.set(node.id, node);
    if (ctx.parentNode) {
      ctx.parentNode.children.push(node);
    }
    Object.assign(ctx.tree, this.resolveRuntime(ctx));
    return node;
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

  /** The node-owning elements' runtime core (plugin/group/synth). */
  protected nodeRuntime(ctx: RuntimeContext, run: boolean): NodeRuntime {
    return { ...this.baseRuntime(ctx), run: run ? 1 : 0, loaded: false, nodeId: 0 };
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
   *  scope — then process each with the cumulative scope. */
  protected processChildren(ctx: RuntimeContext): void {
    const parent = ctx.tree as ScParentRuntime;
    const name = nameOf(ctx.tree);
    const path = name ? [...ctx.path, name] : ctx.path;

    const scope = [...this.walkScElements()].map((el) => el.hydrate(randomId()));

    checkDuplicateNames(scope);

    const childScope = [...scope, ...ctx.scope];
    for (const child of scope) {
      (child._element as ScElement).process({ ...ctx, tree: child, scope: childScope, parentNode: parent, path });
    }
  }

  // ── Shared bind-resolution machinery ────────────────────────────────────

  /** Resolve a name path against the scope, processing the target on demand
   *  (forward references). */
  protected resolveNode(ctx: RuntimeContext, path: string[]): ScElementRuntime | undefined {
    const [name, ...rest] = path;
    const idx = ctx.scope.findIndex((s) => nameOf(s) === name);
    if (idx < 0) return undefined;

    const item = ctx.scope[idx];
    const target = ctx.nodes.get(item.id) ?? (item._element as ScElement).process({ ...ctx, tree: item });

    return walkPath(target, rest);
  }

  /** Resolve `bind`'s node + control-name pair: the leading segments name a
   *  node in scope (none targets the parent node), the last segment a state
   *  child declared on it. */
  protected resolveControlBind(ctx: RuntimeContext, bind: string): { target: ScElementRuntime; controlName: string } {
    const segments = bind.split(".");
    const controlName = segments.pop()!;
    const target = segments.length > 0 ? this.resolveNode(ctx, segments) : ctx.parentNode;
    if (!target || !isNodeRuntime(target)) {
      throw new Error(`<${typeOf(ctx.tree)} bind="${bind}">: does not match any node in scope`);
    }
    if (!isParentRuntime(target) || !target.children.some((c) => isStateRuntime(c) && nameOf(c) === controlName)) {
      const targetName = nameOf(target) ?? target.id;
      throw new Error(
        `<${typeOf(ctx.tree)} bind="${bind}">: control "${controlName}" is not declared on <${typeOf(target)} name="${targetName}">`,
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
      const targetState = (target as ScParentRuntime).children.find(
        (c) => isStateRuntime(c) && nameOf(c) === controlName,
      )!;
      this.checkCircularBind(ctx, targetState.id);
      targets[path] = targetState.id;
    }

    return { targets, expression: parsed.expression };
  }

  protected checkCircularBind(ctx: RuntimeContext, targetId: string): void {
    const visited = new Set<string>([ctx.tree.id]);
    const queue = [targetId];
    while (queue.length > 0) {
      const current = queue.pop()!;
      if (visited.has(current)) {
        throw new Error(`<${typeOf(ctx.tree)} name="${nameOf(ctx.tree)}">: circular bind reference detected`);
      }
      visited.add(current);
      const node = ctx.nodes.get(current);
      if (!node || !isStateRuntime(node)) continue;
      // The runtime values are still unmerged on a state node that's
      // mid-processing (we got here through its own bind resolve) — its
      // targets aren't known yet, but the cycle is still caught from the
      // other end once they are.
      if (node.targets) queue.push(...Object.values(node.targets));
    }
  }

  /** Resolve a visual/input bind to its target state item's id. */
  protected resolveVisualBind(ctx: RuntimeContext, bind: string): InputRuntime {
    const { target, controlName } = this.resolveControlBind(ctx, bind);
    const control = (target as ScParentRuntime).children.find(
      (c) => isStateRuntime(c) && nameOf(c) === controlName,
    )!;
    return { ...this.baseRuntime(ctx), targetId: control.id };
  }

  // TEST: the registry item's `_element` must be THIS mounted component
  // instance — i.e. the runtime registry gives access to the live web
  // component (and its methods) from outside the DOM. Deferred one task: the
  // first render races the parse/registerAll in the same microtask queue.
  protected firstUpdated(): void {
    setTimeout(() => {
      const item = this.item;
      const el = item?._element;
      console.log(
        `[sc-element test] <${this.tagName.toLowerCase()} id="${this.id}">`,
        `registry._element === this: ${el === this}`,
        "| ctor:", el?.constructor.name ?? "(no item)",
        "| proto methods:", el ? Object.getOwnPropertyNames(Object.getPrototypeOf(el)) : null,
        "| _element:", el,
      );
    }, 0);
  }
}
