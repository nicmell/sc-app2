// The XSD spec contract. Each sc-* component ships a colocated `<tag>.spec.ts`
// exporting a plain-data `ElementSpec` describing its schema surface (attributes
// + content model + category); `scripts/generate-xsd.ts` reads every spec and
// emits `sc-plugin-schema.xsd`. Pure JSON — no Lit, no runtime — so the
// generator runs standalone; at runtime the SAME spec drives getProp coercion
// and validateProps, and the xsd-generate snapshot test pins the schema.

/** An element's placement class. Feeds the per-category content-model groups
 *  (internal/xsd/groups.ts): `input`/`visual`/`widget`/`state`/`node`/`synthdef`
 *  each become an `<xs:group>` that `blockContent` composes; `ugen`/`option`/
 *  `envelope` are child-only — reached solely through a parent's
 *  `content.choice`, never a group. */
export type Category =
  | "input"
  | "visual"
  | "widget"
  | "state"
  | "node"
  | "synthdef"
  | "ugen"
  | "option"
  | "envelope";

/** The runtime-prop attribute namespace: `bind:min="vars.lo"` is the dynamic
 *  sibling of `min`. Entries declare it once on the root
 *  (`xmlns:bind="urn:sc-app:bind"` — required for Chrome's namespace-strict
 *  text/xml parse); the RUNTIME matches by QUALIFIED NAME (`bind:` prefix,
 *  canonical — the portable API across happy-dom and the browser), while the
 *  XSD admits the whole namespace via xs:anyAttribute. */
export const BIND_NS = "urn:sc-app:bind";
export const bindAttr = (name: string): string => `bind:${name}`;

/** Shared to every attribute: `required` → `use="required"` (else `"optional"`);
 *  `runtime` (DEFAULT TRUE — set `false` to opt out) marks the attr as
 *  bindable: the runtime evaluates its `bind:`-prefixed sibling live
 *  (ScElement's runtime-prop machinery), the two forms are mutually exclusive
 *  (validateProps), and a `required` runtime attr is satisfied by either form
 *  — so it emits `use="optional"` in the XSD (one-of waits for XSD 1.1
 *  asserts). Opt out for target references (`bind`), parse-time-only data,
 *  and genuinely-reactive widget props. */
interface AttrCommon {
  required?: boolean;
  runtime?: boolean;
}

/** One attribute, discriminated on `type` — maps 1:1 to `<xs:attribute>`. `enum`
 *  emits an inline `<xs:simpleType>` restriction; `scalar` is xs:string in the
 *  schema but number-if-numeric-else-string at runtime (string-capable state);
 *  the rest are xs: builtins. */
export type AttrSpec =
  | (AttrCommon & { type: "string" })
  | (AttrCommon & { type: "decimal" })
  | (AttrCommon & { type: "integer" })
  | (AttrCommon & { type: "boolean" })
  | (AttrCommon & { type: "scalar" })
  | (AttrCommon & { type: "enum"; values: readonly string[] });

/** The content model — XSD's own vocabulary. Omit it entirely for empty content
 *  (attributes only). `choice` lists element tags and/or group names (the
 *  generator resolves each ref); `mixed` allows PCDATA (`mixed="true"`). */
export interface Content {
  choice?: string[];
  mixed?: boolean;
}

/** One authored element's whole schema surface. `tag` must be an `ELEMENTS`
 *  value (sc-plugin excepted — it's the app-synthesized host, never authored). */
export interface ElementSpec {
  tag: string;
  category: Category;
  attrs?: Record<string, AttrSpec>;
  content?: Content;
}
