// The XSD spec contract. Each sc-* component ships a colocated `<tag>.spec.ts`
// exporting a plain-data `ElementSpec` describing its schema surface (attributes
// + content model + category); `scripts/generate-xsd.ts` reads every spec and
// emits `sc-plugin-schema.xsd`. Pure JSON — no Lit, no runtime — so the
// generator runs standalone; at runtime the SAME spec drives getProp coercion
// and the engine's validate, and the xsd-generate snapshot test pins the schema.

/** An element's placement class. Feeds the per-category content-model groups
 *  (internal/xsd/groups.ts): `input`/`visual`/`widget`/`state`/`node`/`synthdef`
 *  each become an `<xs:group>` that `blockContent` composes; `root`/`ugen`/`option`
 *  are reached solely through explicit placement, never a category group. */
export type Category =
  | "root"
  | "input"
  | "visual"
  | "widget"
  | "state"
  | "node"
  | "synthdef"
  | "ugen"
  | "option";

/** The runtime-prop attribute namespace: `bind:min="vars.lo"` is the dynamic
 *  sibling of `min`. Entries declare it once on the root
 *  (`xmlns:bind="urn:sc-app:bind"` — required for Chrome's namespace-strict
 *  text/xml parse); the RUNTIME matches by QUALIFIED NAME (`bind:` prefix,
 *  canonical — the portable API across happy-dom and the browser), while the
 *  XSD admits the whole namespace via xs:anyAttribute. */
export const BIND_NS = "urn:sc-app:bind";
export const bindAttr = (name: string): string => `bind:${name}`;

/** The attributes every element accepts without declaring them: the XSD's
 *  hand-authored `commonAttrs` attributeGroup (xsd/preamble.xml — keep that in
 *  step), the runtime's unknown-attribute allowance (the engine's validate), and the
 *  generator's skip-list (a spec attr with one of these names is already
 *  admitted by the group and must not be re-declared). ONE set, three gates. */
export const COMMON_ATTRS = new Set(["id", "class", "title", "style"]);

/** Shared to every attribute: `required` → `use="required"` (else `"optional"`);
 *  `runtime` (DEFAULT TRUE — set `false` to opt out) marks the attr as
 *  bindable: the runtime evaluates its `bind:`-prefixed sibling live
 *  (ScElement's runtime-prop machinery), the two forms are mutually exclusive
 *  (the engine's validate), and a `required` runtime attr is satisfied by either form
 *  — so it emits `use="optional"` in the XSD (one-of waits for XSD 1.1
 *  asserts). Opt out for target references (`bind`), parse-time-only data,
 *  and genuinely-reactive widget props. */
interface AttrCommon {
  required?: boolean;
  runtime?: boolean;
  /** Value getProp returns when neither the static attr nor a bind: value is
   *  present; also emitted as the XSD attribute's `default`. */
  default?: string | number | boolean;
  /** Numeric range facets, meaningful only on `decimal`/`integer` attrs. */
  min?: number;
  max?: number;
  exclusiveMin?: number;
}

/** One attribute, discriminated on `type` — maps 1:1 to `<xs:attribute>`. `enum`
 *  and `name` emit inline `<xs:simpleType>` restrictions; `scalar` and `vector`
 *  are xs:string in the schema but have richer runtime coercion. */
export type AttrSpec =
  | (AttrCommon & { type: "string" })
  // One bind-path segment identifier (`freq`, `mod-freq`), not a dotted path.
  | (AttrCommon & { type: "name" })
  | (AttrCommon & { type: "decimal" })
  | (AttrCommon & { type: "integer" })
  | (AttrCommon & { type: "boolean" })
  | (AttrCommon & { type: "scalar" })
  // scalar-or-ARRAY: a comma-list of numerics coerces to number[] (a state
  // element's `value` — control-array params, envelope buffers); a single
  // token or a non-numeric list keeps the scalar semantics (string vars).
  // xs:string in the schema; the runtime is the gate.
  // `numeric: true` makes the attr numeric-STRICT: a static value whose
  // coercion stays a string fails the engine's validate (sc-control's value,
  // sc-keyboard's envelope — OSC/compiler-bound floats); without it the
  // string fallback is legal state (sc-var's string values).
  | (AttrCommon & { type: "vector"; numeric?: boolean })
  | (AttrCommon & { type: "enum"; values: readonly string[] });

/** The content model — XSD's own vocabulary. Omit it entirely for empty content
 *  (attributes only). `choice` lists element tags and/or group names (the
 *  generator resolves each ref); `mixed` allows PCDATA (`mixed="true"`). */
export interface Content {
  choice?: string[];
  mixed?: boolean;
}

/** One authored element's whole schema surface. `tag` must be an `ELEMENTS` value. */
export interface ElementSpec {
  tag: string;
  category: Category;
  attrs?: Record<string, AttrSpec>;
  content?: Content;
}
