// Static-COERCION toolbox + canonical `failValidation` shape. The shared Rust
// `sc-validate` crate owns static entry validation (wasm at parseEntry, native
// at upload); this file only supplies spec coercion for getProp and the
// runtime-resolution overrides' canonical `<tag>:` errors.

import { tryEvalCallLiteral } from "@/lib/expression";
import type { AttrSpec } from "@/sc-elements/internal/xsd/types";

/** Boolean coercion shared by the static and evaluated forms — HTML-flavored:
 *  everything is true except the explicit falsy spellings (`"false"`, `"0"`,
 *  the empty string, the number 0). The static form is pre-gated by the
 *  shared Rust validator's true|false|1|0 lexical check; evaluated values get the
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
