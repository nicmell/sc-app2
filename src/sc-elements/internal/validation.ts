// Attribute validation + runtime-inference helpers over the live elements,
// as plain functions taking the element explicitly where the error messages
// or cycle seeds need it (the ScElement base keeps only the parse engine).
// Hydrate-time: the require*/failValidation primitives the components'
// `validate()` overrides build on, plus checkDuplicateNames over a sibling
// scope. Process-time: the bind-resolution machinery the `resolveRuntime`
// overrides build on. The error messages are the runtime gate's contract —
// pinned verbatim by tests/examples.test.ts and the CDP harness.

import { ELEMENTS } from "@/constants/sc-elements";
import { parseBind } from "@/lib/utils/expression";
import { isNodeRuntime, isStateRuntime, typeOf } from "@/lib/utils/guards";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import type { ScState } from "@/sc-elements/internal/sc-state";
import type { BaseRuntime, Expr, InputRuntime, RuntimeContext } from "@/types/runtime";

const SC_ELEMENT_SELECTOR = Object.values(ELEMENTS).join(", ");

// ── Attribute validation (hydrate-time) ─────────────────────────────────────

/** Throw a validation error in the canonical `<tag>: message` shape. */
export function failValidation(el: Element, message: string): never {
  throw new Error(`<${el.tagName.toLowerCase()}>: ${message}`);
}

/** Require a non-empty reactive property (backing a required attribute). */
export function requireProp(el: Element, name: string, value: string): void {
  if (!value) failValidation(el, `missing required "${name}" attribute`);
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
  return (el as { name?: string }).name;
}

/** The runtime core every element shares. */
export function baseRuntime(ctx: RuntimeContext): BaseRuntime {
  return { _rootScNode: ctx.rootNode, _parentScNode: ctx.parentNode, path: ctx.path, enabled: true };
}

function walkPath(node: ScElement, path: string[]): ScElement | undefined {
  if (path.length === 0) return node;
  if (node._scChildren) {
    const [name, ...rest] = path;
    const child = node._scChildren.find((c) => nameOf(c) === name);
    return child ? walkPath(child, rest) : undefined;
  }
  return undefined;
}

/** Resolve a name path against the scope, processing the target on demand
 *  (forward references). */
export function resolveNode(ctx: RuntimeContext, path: string[]): ScElement | undefined {
  const [name, ...rest] = path;
  const el = ctx.scope.find((s) => nameOf(s) === name);
  if (!el) return undefined;

  const target = ctx.nodes.has(el) ? el : el.process(ctx);

  return walkPath(target, rest);
}

/** Resolve `el`'s bind into its node + control-name pair: the leading
 *  segments name a node in scope (none targets the parent node), the last
 *  segment a state child declared on it. */
export function resolveControlBind(
  el: Element,
  ctx: RuntimeContext,
  bind: string,
): { target: ScElement; controlName: string } {
  const tag = el.tagName.toLowerCase();
  const segments = bind.split(".");
  const controlName = segments.pop()!;
  const target = segments.length > 0 ? resolveNode(ctx, segments) : ctx.parentNode;
  if (!target || !isNodeRuntime(target)) {
    throw new Error(`<${tag} bind="${bind}">: does not match any node in scope`);
  }
  if (!target._scChildren?.some((c) => isStateRuntime(c) && nameOf(c) === controlName)) {
    const targetName = nameOf(target) ?? target.id;
    throw new Error(
      `<${tag} bind="${bind}">: control "${controlName}" is not declared on <${typeOf(target)} name="${targetName}">`,
    );
  }
  return { target, controlName };
}

/** Resolve `el`'s stateful bind (an enabled sc-control / sc-var referencing
 *  other controls/vars): plain dot-paths or an arithmetic expression over
 *  them. */
export function resolveStateBind(
  el: ScElement,
  ctx: RuntimeContext,
  bind: string,
): { targets: Record<string, ScState>; expression?: Expr } {
  const parsed = parseBind(bind);
  const targets: Record<string, ScState> = {};

  for (const path of parsed.paths) {
    const { target, controlName } = resolveControlBind(el, ctx, path);
    const targetState = target._scChildren!.find((c) => isStateRuntime(c) && nameOf(c) === controlName) as ScState;
    checkCircularBind(el, targetState);
    targets[path] = targetState;
  }

  return { targets, expression: parsed.expression };
}

/** Walk the bind graph from `target` through the live `targets` references —
 *  no registry/map lookups needed — rejecting any path back to `el`. */
export function checkCircularBind(el: ScElement, target: ScElement): void {
  const visited = new Set<ScElement>([el]);
  const queue = [target];
  while (queue.length > 0) {
    const current = queue.pop()!;
    if (visited.has(current)) {
      const name = nameOf(el);
      throw new Error(`<${el.tagName.toLowerCase()} name="${name}">: circular bind reference detected`);
    }
    visited.add(current);
    // The runtime values are still unassigned on a state element that's
    // mid-processing (we got here through its own bind resolve) — its
    // targets aren't known yet, but the cycle is still caught from the
    // other end once they are.
    if (isStateRuntime(current) && current.targets) queue.push(...Object.values(current.targets));
  }
}

/** Resolve `el`'s visual/input bind to its target state element. */
export function resolveVisualBind(el: Element, ctx: RuntimeContext, bind: string): InputRuntime {
  const { target, controlName } = resolveControlBind(el, ctx, bind);
  const control = target._scChildren!.find((c) => isStateRuntime(c) && nameOf(c) === controlName)!;
  return { ...baseRuntime(ctx), _targetScNode: control };
}
