// The whole parse-time gate — spec validation + static coercion — and the
// runtime-inference helpers over live elements, all as plain functions taking
// the element explicitly where the error messages or cycle seeds need it.
// ScElement keeps the parse ENGINE and the live evaluated runtime only.
// Parse-time: failValidation via validateProps/validate, plus
// checkDuplicateNames per sibling scope in processChildren.
// Process-time: the bind-resolution machinery the `resolveRuntime` overrides
// build on. The error messages are the runtime gate's contract — pinned
// verbatim by src/sc-elements/examples.test.ts and the CDP harness.

import { ELEMENTS } from "@/constants/sc-elements";
import { parseBind, tryEvalCallLiteral } from "@/lib/expression";
import { isNodeRuntime, isStateRuntime, isSynthDefRuntime, typeOf } from "@/lib/utils/guards";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import type { ScState } from "@/sc-elements/internal/sc-state";
import type { ScSynthDef } from "@/sc-elements/synthdef/sc-synthdef";
import { bindAttr, COMMON_ATTRS, type AttrSpec } from "@/sc-elements/internal/xsd/types";
import type { BaseRuntime, Expr, RuntimeContext } from "@/types/runtime";

// ── Attribute validation (parse-time) ──────────────────────────────────────

// XML Schema lexical spaces for the primitive attribute types we coerce.
// Number() is deliberately not used for validation: it accepts empty strings,
// whitespace, exponents for decimals, and fractional integers.
const XSD_DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
const XSD_INTEGER = /^[+-]?\d+$/;
const XSD_BOOLEAN = new Set(["true", "false", "1", "0"]);
const NAME_SEGMENT = /^[A-Za-z_]\w*(?:-[A-Za-z_]\w*)*$/;
const SC_ELEMENT_SELECTOR = Object.values(ELEMENTS).join(", ");

/** Coerce a scalar string to a number when it is numeric, preserving strings
 *  (including empty/whitespace strings) otherwise. */
export function coerceScalar(value: string): string | number {
  const n = Number(value);
  return value.trim() !== "" && !Number.isNaN(n) ? n : value;
}

/** Pure vector coercion: an already-array value passes through; a comma-list
 *  of numerics becomes number[]; anything else keeps scalar semantics. Static
 *  call evaluation is performed by coerceStatic before this function, while
 *  evaluated values call this function directly and therefore can never turn
 *  a call-shaped string into an array. */
export function coerceVector(value: number | string | number[]): string | number | number[] {
  if (typeof value !== "string") return value;
  const tokens = value.split(",").map((s) => s.trim());
  if (tokens.length >= 2 && tokens.every((t) => t !== "" && !Number.isNaN(Number(t)))) {
    return tokens.map(Number);
  }
  return coerceScalar(value);
}

/** Coerce a static attribute string per its spec. Vector call-shaped values
 *  are tried through the strict static evaluator first; live evaluated values
 *  remain on ScElement and use pure coerceVector with its once-per-property
 *  warning state. */
export function coerceStatic(
  attr: AttrSpec | undefined,
  raw: string,
): string | number | boolean | number[] {
  if (attr?.type === "decimal" || attr?.type === "integer") return Number(raw);
  if (attr?.type === "boolean") return raw === "true" || raw === "1";
  if (attr?.type === "scalar") return coerceScalar(raw);
  if (attr?.type === "vector") return tryEvalCallLiteral(raw) ?? coerceVector(raw);
  return String(raw); // string / name / enum / untyped
}

/** Throw a validation error in the canonical `<tag>: message` shape. */
export function failValidation(el: Element, message: string): never {
  throw new Error(`<${el.tagName.toLowerCase()}>: ${message}`);
}

/** Spec-driven attribute validation, run before the component's `validate()`:
 *  required present (a runtime attr satisfies it with either form),
 *  static/`bind:` mutual exclusion, numeric lexical/range gates, enum
 *  membership, name syntax, and the attribute-name hygiene: only the
 *  canonical `bind:` prefix carries runtime props (the XSD admits the
 *  NAMESPACE, the runtime matches the QUALIFIED NAME — a foreign prefix would
 *  silently no-op, so it fails loudly), and only spec attrs not opted out have
 *  a `bind:` form. Choice-less content models also reject nested sc-* elements
 *  here; evaluated values remain unvalidated. */
export function validateProps(el: ScElement): void {
  const attrs = el.spec?.attrs ?? {};
  for (const [name, attr] of Object.entries(attrs)) {
    const raw = el.getAttribute(name);
    const dynamic = attr.runtime !== false ? el.getAttribute(bindAttr(name)) : null;
    if (raw !== null && dynamic !== null) {
      failValidation(el, `"${name}" and "${bindAttr(name)}" are mutually exclusive`);
    }
    if (raw === null) {
      if (attr.required && dynamic === null) {
        failValidation(el, `missing required "${name}" attribute`);
      }
      continue;
    }
    if (attr.type === "decimal" && !XSD_DECIMAL.test(raw)) {
      failValidation(el, `"${name}" attribute must be a decimal number`);
    }
    if (attr.type === "integer" && !XSD_INTEGER.test(raw)) {
      failValidation(el, `"${name}" attribute must be an integer`);
    }
    if (attr.type === "boolean" && !XSD_BOOLEAN.has(raw)) {
      failValidation(el, `"${name}" attribute must be one of true|false|1|0 (got "${raw}")`);
    }
    if (attr.type === "enum" && !attr.values.includes(raw)) {
      failValidation(
        el,
        `"${name}" attribute must be one of ${attr.values.join("|")} (got "${raw}")`,
      );
    }
    if (attr.type === "name" && !NAME_SEGMENT.test(raw)) {
      failValidation(
        el,
        `"${name}" attribute must be a plain identifier — letters, digits, "_", "-" (got "${raw}")`,
      );
    }
    if (attr.type === "decimal" || attr.type === "integer") {
      const n = Number(raw);
      if (attr.min !== undefined && n < attr.min) {
        failValidation(el, `"${name}" attribute must be ≥ ${attr.min} (got "${raw}")`);
      }
      if (attr.exclusiveMin !== undefined && n <= attr.exclusiveMin) {
        failValidation(el, `"${name}" attribute must be > ${attr.exclusiveMin} (got "${raw}")`);
      }
      if (attr.max !== undefined && n > attr.max) {
        failValidation(el, `"${name}" attribute must be ≤ ${attr.max} (got "${raw}")`);
      }
    }
    // (`vector` has no lexical gate: an all-numeric comma-list is an array,
    // anything else keeps the scalar semantics — string vars included. The
    // numeric-only elements enforce it semantically: ScControl.validate.)
  }
  for (const { name } of Array.from(el.attributes)) {
    // Namespace declarations are XML plumbing, not contract attributes.
    if (name === "xmlns") continue;
    const colon = name.indexOf(":");
    if (colon === -1) {
      if (attrs[name] === undefined && !COMMON_ATTRS.has(name)) {
        failValidation(el, `unknown attribute "${name}"`);
      }
      continue;
    }
    const prefix = name.slice(0, colon);
    if (prefix === "xmlns") continue;
    if (prefix !== "bind") {
      failValidation(el, `unknown attribute namespace prefix "${prefix}:" (use "bind:")`);
    }
    const base = attrs[name.slice(colon + 1)];
    if (base === undefined || base.runtime === false) {
      failValidation(el, `unknown runtime attribute "${name}"`);
    }
  }
  if (!el.spec?.content?.choice?.length && el.querySelector(SC_ELEMENT_SELECTOR)) {
    failValidation(el, "must not contain sc-* elements");
  }
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
