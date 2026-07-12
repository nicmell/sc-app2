// Attribute validation + runtime-inference helpers over the live elements,
// as plain functions taking the element explicitly where the error messages
// or cycle seeds need it (the ScElement base keeps only the parse engine).
// Hydrate-time: the require*/failValidation primitives the components'
// `validate()` overrides build on, plus checkDuplicateNames over a sibling
// scope. Process-time: the bind-resolution machinery the `resolveRuntime`
// overrides build on. The error messages are the runtime gate's contract —
// pinned verbatim by src/sc-elements/examples.test.ts and the CDP harness.

import { ELEMENTS } from "@/constants/sc-elements";
import { parseBind } from "@/lib/expression";
import { isNodeRuntime, isStateRuntime, typeOf } from "@/lib/utils/guards";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import type { ScState } from "@/sc-elements/internal/sc-state";
import type { BaseRuntime, Expr, RuntimeContext } from "@/types/runtime";

const SC_ELEMENT_SELECTOR = Object.values(ELEMENTS).join(", ");

// ── Attribute validation (parse-time) ──────────────────────────────────────

/** Throw a validation error in the canonical `<tag>: message` shape. */
export function failValidation(el: Element, message: string): never {
  throw new Error(`<${el.tagName.toLowerCase()}>: ${message}`);
}

/** Require a non-empty reactive property (backing a required attribute). */
export function requireProp(el: Element, name: string, value: string): void {
  if (!value) failValidation(el, `missing required "${name}" attribute`);
}

/** One bind-path segment: hyphenated identifier words (`freq`, `mod-freq`). */
const NAME_SEGMENT = /^[A-Za-z_]\w*(?:-[A-Za-z_]\w*)*$/;

/** Require a well-formed `name`: exactly the grammar of ONE bind-path
 *  segment. Dots are the path separator — a dotted name would FORGE another
 *  scope's runtime store key (`name="s1.freq"` at the root aliases the
 *  `freq` control of synth `s1`: silent cross-wiring the per-scope duplicate
 *  check cannot see) — and any other illegal character would make the name
 *  unreferenceable by binds/expressions. */
export function requireName(el: Element): void {
  const value = el.getAttribute("name") ?? "";
  requireProp(el, "name", value);
  if (!NAME_SEGMENT.test(value)) {
    failValidation(
      el,
      `"name" attribute must be a plain identifier — letters, digits, "_", "-" (got "${value}")`,
    );
  }
}

/** Reject a numeric property whose attribute didn't parse as a number. */
export function requireNumeric(el: Element, name: string, value: number | undefined): void {
  if (value !== undefined && Number.isNaN(value)) {
    failValidation(el, `"${name}" attribute must be a number`);
  }
}

/** Leaves must not nest other sc-* elements. (Plain DOM children are fine:
 *  an upgraded element has already rendered its own UI into itself.) */
export function requireNoScChildren(el: Element): void {
  if (el.querySelector(SC_ELEMENT_SELECTOR)) failValidation(el, "must not contain sc-* elements");
}

/** Reject duplicate names within one sibling scope (the same name in nested
 *  scopes is fine — inner shadows outer). */
export function checkDuplicateNames(scope: ScElement[]): void {
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

// ── Runtime inference (process-time) ────────────────────────────────────────

export function nameOf(el: Element): string | undefined {
  return el.getAttribute("name") ?? undefined;
}

/** Transparent containers: NAMELESS non-node sc elements (sc-if, sc-select,
 *  sc-radio-group). Naming containers — group/synth/synthdef/ugen, all with
 *  a required `name` — open a sibling scope and a store-path segment;
 *  transparent ones open neither: the parse walks through them, so their
 *  contents live in the enclosing level (unconditionally — an sc-if only
 *  hides visually). The nameless PLUGIN ROOT is a node, not a container —
 *  hence the node exclusion. Lives here (not lib/utils/guards) to avoid an
 *  import cycle: guards ← validation. */
export function isTransparent(el: Element): boolean {
  return !nameOf(el) && !isNodeRuntime(el);
}

/** A parent's sc children as name lookups see them: recursing through
 *  transparent containers, so state inside an sc-if stays addressable on the
 *  enclosing node (`bind="g.x"` with x wrapped in an sc-if under g). */
export function* scChildrenThrough(parent: ScElement): Generator<ScElement> {
  for (const child of parent._scChildren ?? []) {
    yield child;
    if (isTransparent(child)) yield* scChildrenThrough(child);
  }
}

/** The runtime core every element shares. */
export function baseRuntime(ctx: RuntimeContext): BaseRuntime {
  return {
    _rootScNode: ctx.rootNode,
    _parentScNode: ctx.parentNode,
    path: ctx.path,
    enabled: true,
  };
}

function walkPath(node: ScElement, path: string[]): ScElement | undefined {
  if (path.length === 0) return node;
  if (node._scChildren) {
    const [name, ...rest] = path;
    for (const child of scChildrenThrough(node)) {
      if (nameOf(child) === name) return walkPath(child, rest);
    }
  }
  return undefined;
}

/** Resolve a name path against the scope. Only elements that have already
 *  been processed can be referenced — bind targets must be declared BEFORE
 *  their references in DOM order (a name matching a later, not-yet-processed
 *  element is an explicit error; a name matching nothing falls through to
 *  the caller's own error). */
export function resolveNode(
  el: Element,
  ctx: RuntimeContext,
  path: string[],
): ScElement | undefined {
  const [name, ...rest] = path;
  const target = ctx.scope.find((s) => nameOf(s) === name);
  if (!target) return undefined;

  if (!ctx.nodes.has(target)) {
    throw new Error(`<${el.tagName.toLowerCase()}>: "${name}" is referenced before it is declared`);
  }

  return walkPath(target, rest);
}

/** Resolve `el`'s bind into its node + control-name pair: the leading
 *  segments name a node in scope (none targets the parent node), the last
 *  segment a state child declared on it. A BARE name that matches no state
 *  on the parent falls back LEXICALLY: a named state element anywhere in
 *  the enclosing scope chain (a root-level var, an outer group's control) —
 *  so a synth's instance control can derive from a plugin-level var. `attr`
 *  names the attribute the expression came from in the error messages
 *  (`bind` for inputs, `bind:min`/`bind:value`/… for runtime props). */
export function resolveControlBind(
  el: Element,
  ctx: RuntimeContext,
  bind: string,
  attr = "bind",
): { target: ScElement; controlName: string } {
  const tag = el.tagName.toLowerCase();
  const segments = bind.split(".");
  let controlName = segments.pop()!;
  // A numeric TAIL is an array-SLOT selector, not a control name — names
  // cannot start with a digit (mirroring the graph plane's `name.idx`).
  // `env.5` binds slot 5 of the array state `env`: existence resolves on
  // the STATE; the slot indexes its live value at evaluation/write time.
  if (/^\d+$/.test(controlName) && segments.length > 0) {
    controlName = segments.pop()!;
  }
  const target = segments.length > 0 ? resolveNode(el, ctx, segments) : ctx.parentNode;
  if (!target || !isNodeRuntime(target)) {
    throw new Error(`<${tag} ${attr}="${bind}">: does not match any node in scope`);
  }
  if (![...scChildrenThrough(target)].some((c) => isStateRuntime(c) && nameOf(c) === controlName)) {
    // Lexical fallback for the bare-name form: the name may address a STATE
    // element in an enclosing scope (declared before, per resolveNode's
    // bind-order gate). Its effective owner carries the control lookup.
    if (segments.length === 0) {
      const scoped = resolveNode(el, ctx, [controlName]);
      if (scoped && isStateRuntime(scoped)) {
        const owner = scoped.namedScParent ?? ctx.rootNode;
        return { target: owner, controlName };
      }
    }
    // When the state IS declared on the target but only later in the
    // document (not yet processed), give the honest bind-order error
    // instead of "not declared".
    for (const c of target.walkScElements()) {
      if (isStateRuntime(c) && nameOf(c) === controlName) {
        throw new Error(`<${tag}>: "${controlName}" is referenced before it is declared`);
      }
    }
    const targetName = nameOf(target) ?? target.id;
    throw new Error(
      `<${tag} ${attr}="${bind}">: control "${controlName}" is not declared on <${typeOf(target)} name="${targetName}">`,
    );
  }
  return { target, controlName };
}

/** Resolve a stateful bind expression (a runtime prop — `bind:value` on
 *  state, `bind:min`/`bind:label`/… anywhere): plain dot-paths or an arithmetic/
 *  ternary expression over them. `attr` names the source attribute in the
 *  error messages. */
export function resolveStateBind(
  el: ScElement,
  ctx: RuntimeContext,
  bind: string,
  attr = "bind",
): { targets: Record<string, ScState>; expression?: Expr } {
  const parsed = parseBind(bind);
  const targets: Record<string, ScState> = {};

  for (const path of parsed.paths) {
    const { target, controlName } = resolveControlBind(el, ctx, path, attr);
    const targetState = [...scChildrenThrough(target)].find(
      (c) => isStateRuntime(c) && nameOf(c) === controlName,
    ) as ScState;
    // With references restricted to already-processed elements, processing
    // order strictly decreases along any bind chain — the targets graph is a
    // DAG by construction. The only cycle left is the self-reference (an
    // element can still name itself through its mid-processing parent).
    if (targetState === el) {
      throw new Error(
        `<${el.tagName.toLowerCase()} name="${nameOf(el)}">: circular bind reference detected`,
      );
    }
    targets[path] = targetState;
  }

  return { targets, expression: parsed.expression };
}
