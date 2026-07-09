// The XSD spec contract. Each sc-* component ships a colocated `<tag>.spec.ts`
// exporting a plain-data `ElementSpec` describing its schema surface (attributes
// + content model + category); `scripts/generate-xsd.ts` reads every spec and
// emits `sc-plugin-schema.xsd`. Pure JSON — no Lit, no runtime — so the
// generator runs standalone; the `xsd-reconcile` test cross-checks each spec
// against the live component's reactive properties so the two can't drift.

/** An element's placement class. Feeds the per-category content-model groups
 *  (internal/xsd/groups.ts): `input`/`visual`/`widget`/`state`/`node`/`synthdef`
 *  each become an `<xs:group>` that `blockContent` composes; `ugen`/`option` are
 *  child-only — reached solely through a parent's `content.choice`, never a group. */
export type Category =
  | "input"
  | "visual"
  | "widget"
  | "state"
  | "node"
  | "synthdef"
  | "ugen"
  | "option";

/** Shared to every attribute: `required` → `use="required"` (else `"optional"`). */
interface AttrCommon {
  required?: boolean;
}

/** One attribute, discriminated on `type` — maps 1:1 to `<xs:attribute>`. `enum`
 *  emits an inline `<xs:simpleType>` restriction; the rest are xs: builtins. */
export type AttrSpec =
  | (AttrCommon & { type: "string" })
  | (AttrCommon & { type: "decimal" })
  | (AttrCommon & { type: "integer" })
  | (AttrCommon & { type: "boolean" })
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
