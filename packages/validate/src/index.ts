// The frontend surface of the shared Rust static validator (the sc-validate
// crate compiled by `yarn generate:wasm` into pkg/). Exports: the memoized
// async `initValidator` (awaited once at boot / test setup), the sync
// `validateEntry` — the whole static gate: wasm-validate the entry text
// (multi-error, newline-joined), then DOMParser-parse it and return the live
// document element — and the spec map read out of the SAME module
// (`getSpec`/`getSpecTags`): the crate's authored specs/<tag>.spec.json files
// are the ONE spec source, consumed here by getProp coercion and the
// runtime-prop machinery. Bind/reference resolution stays in the parse engine.

import init, { common_attrs, element_specs, validate_entry } from "../pkg/sc_validate";

/** Shared to every attribute — exactly what the runtime reads: `runtime`
 *  gates the `bind:` sibling (contentHash + runtime-prop resolution),
 *  `default` is applied by getProp when neither form supplies a value. The
 *  required flag and the numeric facets are static-gate-only and stay
 *  crate-side. */
interface AttrCommon {
  runtime: boolean;
  default?: string | number | boolean;
}

/** One attribute, discriminated on `type` — the crate's AttrDef as the wasm
 *  map serializes it. `scalar` and `vector` are strings in the schema but
 *  have richer runtime coercion. */
export type AttrSpec =
  | (AttrCommon & { type: "string" })
  | (AttrCommon & { type: "name" })
  | (AttrCommon & { type: "decimal" })
  | (AttrCommon & { type: "integer" })
  | (AttrCommon & { type: "boolean" })
  | (AttrCommon & { type: "scalar" })
  | (AttrCommon & { type: "vector" })
  | (AttrCommon & { type: "enum"; values: readonly string[] });

/** One element's runtime spec surface: the attribute contract in AUTHORED
 *  order (the runtime-prop resolution order). */
export interface ElementSpec {
  attrs: Record<string, AttrSpec>;
}

let ready: Promise<void> | undefined;
let specs: Record<string, ElementSpec> | undefined;

/** Instantiate the wasm module once (subsequent calls join the first) and
 *  parse the spec map out of it. Without an argument the glue fetches
 *  pkg/sc_validate_bg.wasm relative to its own URL (the Vite asset path);
 *  tests pass the bytes directly. */
export function initValidator(input?: BufferSource): Promise<void> {
  ready ??= (input === undefined ? init() : init({ module_or_path: input })).then(
    () => {
      specs = JSON.parse(element_specs()) as Record<string, ElementSpec>;
    },
    (e: unknown) => {
      // Don't cache the rejection: a later call (a plugin reload after a
      // transient fetch failure) retries the instantiation.
      ready = undefined;
      throw e;
    },
  );
  return ready;
}

function requireSpecs(): Record<string, ElementSpec> {
  if (!specs) {
    throw new Error("sc-validate is not initialized — await initValidator() first");
  }
  return specs;
}

/** The spec for a tag, or undefined for unknown (html/foreign) tags. Throws
 *  before init — a silent undefined would skip coercion and mint
 *  wrong-but-plausible content-hash ids. */
export function getSpec(tag: string): ElementSpec | undefined {
  return requireSpecs()[tag];
}

/** Every sc tag carrying a spec (the crate registry's key set). */
export function getSpecTags(): string[] {
  return Object.keys(requireSpecs());
}

/** The crate's COMMON_ATTRS (attributes every element accepts undeclared) —
 *  exported so the frontend's own set can be pinned against the crate. */
export function getCommonAttrs(): string[] {
  requireSpecs();
  return JSON.parse(common_attrs()) as string[];
}

/** Shared by every violation: the offending element's tag, the 1-based
 *  source position (the attribute's own qname for attribute rules, the
 *  offending child/text for content rules, the element start otherwise), and
 *  the pre-rendered display line (`<tag>: … (line:col)` — rendered by the
 *  crate, never re-derived here). */
interface ViolationBase {
  tag: string;
  line: number;
  column: number;
  message: string;
}

/** One structured violation from the static gate, discriminated on the
 *  STABLE `code` (the crate's ViolationKind serde tag) with the rule's own
 *  payload — the shape editor diagnostics switch on (quick-fixes read
 *  `allowed`, the violated bound, …). */
export type ValidationViolation = ViolationBase &
  (
    | { code: "mutually-exclusive-attr"; attr: string }
    | { code: "missing-required-attr"; attr: string }
    | { code: "invalid-decimal"; attr: string; value: string }
    | { code: "invalid-integer"; attr: string; value: string }
    | { code: "invalid-boolean"; attr: string; value: string }
    | { code: "invalid-enum"; attr: string; value: string; allowed: string[] }
    | { code: "invalid-name"; attr: string; value: string }
    | { code: "value-below-min"; attr: string; value: string; min: number }
    | { code: "value-below-exclusive-min"; attr: string; value: string; min: number }
    | { code: "value-above-max"; attr: string; value: string; max: number }
    | { code: "invalid-numeric-vector"; attr: string; value: string }
    | { code: "unknown-attr"; attr: string }
    | { code: "unknown-attr-prefix"; prefix: string }
    | { code: "unknown-runtime-attr"; attr: string }
    | { code: "wrong-namespace" }
    | { code: "unexpected-child"; child: string }
    | { code: "unexpected-text" }
    | { code: "missing-required-child"; child: string }
    | { code: "wrong-root"; root: string }
  );

/** A classified document-level failure (the entry never survived the XML
 *  parser): carried on the thrown EntryParseError's `parseError`. */
export interface ValidationParseError {
  code: "not-well-formed" | "too-deep";
  message: string;
  line: number;
  column: number;
}

/** Thrown by validateEntry on a parse failure: the canonical
 *  `plugin entry is not valid XHTML: …` message, with the classified
 *  ValidationParseError (code + position) on `parseError` when the wasm
 *  produced one (absent only for glue-level failures). */
export class EntryParseError extends Error {
  readonly parseError?: ValidationParseError;

  constructor(message: string, cause: unknown, parseError?: ValidationParseError) {
    super(message, { cause });
    this.name = "EntryParseError";
    this.parseError = parseError;
  }
}

/** Thrown by validateEntry when the entry violates the spec: `message` is
 *  every violation's display line newline-joined; `violations` keeps the
 *  structured list. */
export class ValidationError extends Error {
  readonly violations: readonly ValidationViolation[];

  constructor(violations: readonly ValidationViolation[]) {
    super(violations.map((violation) => violation.message).join("\n"));
    this.name = "ValidationError";
    this.violations = violations;
  }
}

/** Validate + parse a plugin entry document. Throws the canonical shapes:
 *  `plugin entry is not valid XHTML: …` on a parse failure (the classified
 *  ValidationParseError rides `cause`), else a ValidationError with every
 *  spec violation newline-joined and the structured list on `.violations`.
 *  Returns the authored root element. */
export function validateEntry(xml: string): Element {
  requireSpecs();
  let violations: ValidationViolation[];
  try {
    violations = JSON.parse(validate_entry(xml)) as ValidationViolation[];
  } catch (e) {
    // The wasm throws the classified parse failure as JSON; a non-JSON value
    // (a glue-level failure) falls back to its string form.
    let parseError: ValidationParseError | undefined;
    try {
      parseError = JSON.parse(String(e)) as ValidationParseError;
    } catch {
      parseError = undefined;
    }
    throw new EntryParseError(
      `plugin entry is not valid XHTML: ${parseError?.message ?? String(e)}`,
      e,
      parseError,
    );
  }
  if (violations.length > 0) {
    throw new ValidationError(violations);
  }
  // The wasm side already proved well-formedness; this parse only exists to
  // produce the live Element (the parsererror probe is a defensive fallback
  // for DOM-parser/roxmltree divergence).
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`plugin entry is not valid XHTML: ${parseError.textContent}`);
  }
  return doc.documentElement;
}
