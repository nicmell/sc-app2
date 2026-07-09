// Drift guard between the two sources: every spec must match its component's
// reactive properties (the schema is generated from specs; the components are
// the real attribute contract). Checks the spec/ELEMENTS bijection, that each
// spec's attribute NAMES equal the component's attribute-bearing properties
// (by attribute name, so sc-ugen's `type` ↔ its `ugen` property), and that the
// coarse types agree. `required`, enum values, and content models have no
// component counterpart — those stay trust-the-spec.

import { beforeAll, describe, expect, it } from "vitest";
import { registerScElements } from "@/sc-elements";
import type { AttrSpec, ElementSpec } from "@/sc-elements/internal/xsd/types";
import { authoredTags, loadSpecs } from "../../../scripts/generate-xsd";

type Coarse = "number" | "boolean" | "string";

/** The spec attribute's XSD-base coarse type. */
const specCoarse = (a: AttrSpec): Coarse =>
  a.type === "decimal" || a.type === "integer"
    ? "number"
    : a.type === "boolean"
      ? "boolean"
      : "string"; // enum + string

/** The component property's coarse type; `null` when a custom converter owns the
 *  coercion (e.g. `run`) — then we don't cross-check the type. */
const propCoarse = (d: { type?: unknown; converter?: unknown }): Coarse | null =>
  d.converter ? null : d.type === Number ? "number" : d.type === Boolean ? "boolean" : "string";

let specs: Map<string, ElementSpec>;

beforeAll(async () => {
  registerScElements();
  specs = await loadSpecs();
});

describe("XSD spec / component reconciliation", () => {
  it("specs and ELEMENTS form a bijection (no orphan spec, no unspecced element)", () => {
    expect([...specs.keys()].sort()).toEqual([...authoredTags()].sort());
  });

  for (const tag of authoredTags()) {
    it(`${tag}: spec attributes match the component's properties`, () => {
      const spec = specs.get(tag)!;
      const ctor = customElements.get(tag) as unknown as {
        elementProperties: Map<string, { type?: unknown; converter?: unknown; state?: boolean; attribute?: unknown }>;
      };
      // The component's attribute-bearing properties, keyed by attribute name.
      const compAttrs = new Map<string, { type?: unknown; converter?: unknown }>();
      for (const [key, d] of ctor.elementProperties) {
        if (d.state || d.attribute === false) continue;
        compAttrs.set(typeof d.attribute === "string" ? d.attribute : String(key), d);
      }
      const specAttrs = spec.attrs ?? {};
      expect(new Set(Object.keys(specAttrs))).toEqual(new Set(compAttrs.keys()));
      for (const [name, a] of Object.entries(specAttrs)) {
        const coarse = propCoarse(compAttrs.get(name)!);
        if (coarse) expect(specCoarse(a), `${tag}.${name} type`).toBe(coarse);
      }
    });
  }
});
