// STEP 1's toolbox — the STATIC parse-time gate, as plain functions taking
// the element explicitly where the error messages need it: the spec-driven
// attribute validation (`validateProps`, what the base `validate()` runs),
// the canonical `failValidation` shape, and the static coercion `getProp`'s
// attribute reads share. The error messages are the runtime gate's
// contract — pinned verbatim by src/sc-elements/examples.test.ts and the
// CDP harness. STEP 2's toolbox (name/scope/bind resolution) lives in
// internal/resolution.ts.

import { ELEMENTS } from "@/constants/sc-elements";
import { tryEvalCallLiteral } from "@/lib/expression";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import { bindAttr, COMMON_ATTRS, type AttrSpec } from "@/sc-elements/internal/xsd/types";

// XML Schema lexical spaces for the primitive attribute types we coerce.
// Number() is deliberately not used for validation: it accepts empty strings,
// whitespace, exponents for decimals, and fractional integers.
const XSD_DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
const XSD_INTEGER = /^[+-]?\d+$/;
const XSD_BOOLEAN = new Set(["true", "false", "1", "0"]);
const NAME_SEGMENT = /^[A-Za-z_]\w*(?:-[A-Za-z_]\w*)*$/;
const SC_ELEMENT_SELECTOR = Object.values(ELEMENTS).join(", ");

/** Boolean coercion shared by the static and evaluated forms — HTML-flavored:
 *  everything is true except the explicit falsy spellings (`"false"`, `"0"`,
 *  the empty string, the number 0). The static form is pre-gated by
 *  validateProps' true|false|1|0 lexical check; evaluated values get the
 *  same reading, so a bound string `"false"` disables like the attribute. */
export function coerceBoolean(value: string | number): boolean {
  return value !== "" && value !== "false" && value !== "0" && value !== 0;
}

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
  if (attr?.type === "boolean") return coerceBoolean(raw);
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
    // An empty name is a MISSING one (the old requireProp semantics), not a
    // grammar violation.
    if (attr.type === "name" && raw === "") {
      failValidation(el, `missing required "${name}" attribute`);
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
