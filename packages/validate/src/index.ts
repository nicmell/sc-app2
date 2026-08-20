// The frontend surface of the shared Rust static validator (the sc-validate
// crate compiled by `yarn generate:wasm` into pkg/). Exports: the memoized
// async `initValidator` (awaited once at boot / test setup), the sync
// `validateEntry` — the whole static gate: wasm-validate the entry text
// (multi-error, newline-joined), then DOMParser-parse it and return the live
// document element — and the spec map read out of the SAME module
// (`getSpec`/`getSpecTags`): the crate's authored specs/<tag>.spec.json files
// are the ONE spec source, consumed here by getProp coercion and the
// runtime-prop machinery. Bind/reference resolution stays in the parse engine.

import init, { element_specs, validate_entry } from "../pkg/sc_validate";

/** Shared to every attribute: `required` is satisfied by either form when the
 *  attr is `runtime` (bindable via its `bind:` sibling — the default; the
 *  crate emits both flags explicitly). `default` is applied by getProp when
 *  neither form supplies a value; the numeric range facets are validated by
 *  the crate, not read at runtime. */
interface AttrCommon {
  required: boolean;
  runtime: boolean;
  default?: string | number | boolean;
  min?: number;
  max?: number;
  exclusiveMin?: number;
}

/** One attribute, discriminated on `type` — the crate's AttrDef as the wasm
 *  map serializes it. `scalar` and `vector` are strings in the schema but
 *  have richer runtime coercion; `numeric: true` marks a numeric-STRICT
 *  vector. */
export type AttrSpec =
  | (AttrCommon & { type: "string" })
  | (AttrCommon & { type: "name" })
  | (AttrCommon & { type: "decimal" })
  | (AttrCommon & { type: "integer" })
  | (AttrCommon & { type: "boolean" })
  | (AttrCommon & { type: "scalar" })
  | (AttrCommon & { type: "vector"; numeric: boolean })
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
  ready ??= (input === undefined ? init() : init({ module_or_path: input })).then(() => {
    specs = JSON.parse(element_specs()) as Record<string, ElementSpec>;
  });
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

/** Validate + parse a plugin entry document. Throws the canonical shapes:
 *  `plugin entry is not valid XHTML: …` on a parse failure, else every spec
 *  violation newline-joined (a single violation is byte-identical to the old
 *  per-element engine error). Returns the authored root element. */
export function validateEntry(xml: string): Element {
  requireSpecs();
  let violations: string[];
  try {
    violations = validate_entry(xml);
  } catch (e) {
    throw new Error(`plugin entry is not valid XHTML: ${String(e)}`, { cause: e });
  }
  if (violations.length > 0) {
    throw new Error(violations.join("\n"));
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
