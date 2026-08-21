// Registration guard: every ELEMENTS tag must carry a spec in the wasm
// module's map (a specs/<tag>.spec.json missing from spec.rs's SPEC_SOURCES
// would silently skip validation and getProp coercion), and vice versa. Plus
// shape pins proving the crate's serialization carries EXACTLY what the
// runtime reads (type/runtime/default/values — the facets are
// static-gate-only), AUTHORED attr order, and the COMMON_ATTRS pin keeping
// the frontend's hand copy honest (a drift would silently change contentHash
// ids).

import { describe, expect, it } from "vitest";
import { getCommonAttrs, getSpec, getSpecTags } from "@sc-app/validate";
import { ELEMENTS } from "@/constants/sc-elements";
import { COMMON_ATTRS } from "@/sc-elements/internal/spec";

describe("wasm spec map", () => {
  it("is a bijection with ELEMENTS", () => {
    expect(new Set(getSpecTags())).toEqual(new Set(Object.values(ELEMENTS)));
  });

  it("carries exactly the runtime surface: type, runtime, default, values", () => {
    expect(getSpec("sc-scope")?.attrs.frames).toEqual({
      type: "integer",
      runtime: false,
      default: 1024,
    });
    expect(getSpec("sc-control")?.attrs.value).toEqual({ type: "vector", runtime: true });
    expect(getSpec("sc-slider")?.attrs.value).toEqual({ type: "decimal", runtime: true });
    expect(getSpec("sc-ugen")?.attrs.rate).toEqual({
      type: "enum",
      runtime: false,
      values: ["ar", "kr", "ir"],
      default: "ar",
    });
  });

  it("pins the frontend COMMON_ATTRS copy against the crate", () => {
    expect(new Set(getCommonAttrs())).toEqual(COMMON_ATTRS);
  });

  it("keeps the authored attribute order", () => {
    expect(Object.keys(getSpec("sc-scope")?.attrs ?? {})).toEqual([
      "bus",
      "channels",
      "frames",
      "trigger",
      "slope",
      "level",
      "gain",
      "layout",
      "range",
    ]);
  });
});
