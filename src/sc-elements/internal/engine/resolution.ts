// The runtime-resolution toolbox — the name/scope/bind machinery the `resolveRuntime`
// overrides build on, as plain functions over the live elements: name and
// transparency semantics, duplicate-name integrity over a sibling scope,
// name-path resolution against the parse context (bind-order enforced), and
// the bind-expression resolver feeding the runtime-prop machinery. The error
// messages are the runtime gate's contract — pinned verbatim by
// src/sc-elements/__tests__/examples.test.ts and the e2e examples suite
// (yarn e2e examples). Static validation
// lives in the shared Rust crate; coercion helpers used by getProp live in the
// sibling validation.ts.

import { parseBind } from "@/lib/expression";
import {
  isNodeRuntime,
  isParentRuntime,
  isStateRuntime,
  isSynthDefRuntime,
  typeOf,
} from "@/lib/utils/guards";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import type { ScState } from "@/sc-elements/internal/sc-state";
import type { ScSynthDef } from "@/sc-elements/synthdef/sc-synthdef";
import type { Expr, RuntimeContext } from "@/types/runtime";

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
 *  import cycle: guards ← resolution. */
export function isTransparent(el: Element): boolean {
  return !nameOf(el) && !isNodeRuntime(el);
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

function walkPath(node: ScElement, path: string[]): ScElement | undefined {
  if (path.length === 0) return node;
  if (isParentRuntime(node)) {
    const [name, ...rest] = path;
    for (const child of node._scChildren) {
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

/** Resolve a `synthdef` reference attribute: the name must match an actual
 *  `<sc-synthdef>` in scope — any other named element (a group, another
 *  synth) or no match at all is the same error. */
export function resolveSynthDefRef(el: ScElement, ctx: RuntimeContext, name: string): ScSynthDef {
  const target = resolveNode(el, ctx, [name]);
  if (!target || !isSynthDefRuntime(target)) {
    throw new Error(
      `<${el.tagName.toLowerCase()} synthdef="${name}">: does not match any <sc-synthdef>`,
    );
  }
  return target;
}

/** Resolve ONE dot-path to its live STATE element: the leading segments name
 *  a node in scope (none targets the parent node), the last segment a state
 *  child declared on it. A BARE name that matches no state on the parent
 *  falls back LEXICALLY: a named state element anywhere in the enclosing
 *  scope chain (a root-level var, an outer group's control) — so a synth's
 *  instance control can derive from a plugin-level var. `attr` names the
 *  attribute the expression came from in the error messages. */
function resolveStatePath(el: Element, ctx: RuntimeContext, path: string, attr: string): ScState {
  const tag = el.tagName.toLowerCase();
  const segments = path.split(".");
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
    throw new Error(`<${tag} ${attr}="${path}">: does not match any node in scope`);
  }
  const state = target._scChildren.find(
    (c): c is ScState => isStateRuntime(c) && nameOf(c) === controlName,
  );
  if (state) return state;

  // Lexical fallback for the bare-name form: the name may address a STATE
  // element in an enclosing scope (declared before, per resolveNode's
  // bind-order gate). Resolving to the MID-PROCESSING element itself is the
  // one cycle left (an element joins its parent's `_scChildren` only after
  // it finishes processing, so the children lookups can't see it) — reject.
  if (segments.length === 0) {
    const scoped = resolveNode(el, ctx, [controlName]);
    if (scoped === el) {
      throw new Error(`<${tag} name="${nameOf(el)}">: circular bind reference detected`);
    }
    if (scoped && isStateRuntime(scoped)) return scoped;
  }
  // When the state IS declared on the target but only later in the
  // document (not yet processed), give the honest bind-order error
  // instead of "not declared" — unless the DOM probe finds the element
  // ITSELF (the dotted self-reference, e.g. `g.x` from x inside g).
  for (const c of target.walkScElements()) {
    if (isStateRuntime(c) && nameOf(c) === controlName) {
      if (c === el) {
        throw new Error(`<${tag} name="${nameOf(el)}">: circular bind reference detected`);
      }
      throw new Error(`<${tag}>: "${controlName}" is referenced before it is declared`);
    }
  }
  const targetName = nameOf(target) ?? target.id;
  throw new Error(
    `<${tag} ${attr}="${path}">: control "${controlName}" is not declared on <${typeOf(target)} name="${targetName}">`,
  );
}

/** Resolve a bind expression (a runtime prop — `bind:value` on state,
 *  `bind:min`/`bind:label`/… anywhere): plain dot-paths or an arithmetic/
 *  ternary expression over them, each path resolved to its live state
 *  element (`resolveStatePath` — with references restricted to
 *  already-processed elements the targets graph is a DAG by construction).
 *  `attr` names the source attribute in the error messages. */
export function resolveBind(
  el: ScElement,
  ctx: RuntimeContext,
  bind: string,
  attr = "bind",
): { targets: Record<string, ScState>; expression?: Expr } {
  const parsed = parseBind(bind);
  const targets: Record<string, ScState> = {};
  for (const path of parsed.paths) {
    targets[path] = resolveStatePath(el, ctx, path, attr);
  }
  return { targets, expression: parsed.expression };
}
