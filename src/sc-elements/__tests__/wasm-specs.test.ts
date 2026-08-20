// Registration guard: every ELEMENTS tag must carry a spec in the wasm
// module's map (a specs/<tag>.spec.json missing from spec.rs's SPEC_SOURCES
// would silently skip validation and getProp coercion), and vice versa. Plus
// shape pins proving the crate's serialization carries what the runtime
// reads: types, flags, defaults, facets, and AUTHORED attr order.

import { describe, expect, it } from "vitest";
import { getSpec, getSpecTags } from "@sc-app/validate";
import { ELEMENTS } from "@/constants/sc-elements";

describe("wasm spec map", () => {
  it("is a bijection with ELEMENTS", () => {
    expect(new Set(getSpecTags())).toEqual(new Set(Object.values(ELEMENTS)));
  });

  it("carries types, flags, defaults, and facets", () => {
    const frames = getSpec("sc-scope")?.attrs.frames;
    expect(frames).toMatchObject({
      type: "integer",
      required: false,
      runtime: false,
      min: 1,
      max: 16384,
      default: 1024,
    });
    expect(getSpec("sc-control")?.attrs.value).toMatchObject({ type: "vector", numeric: true });
    expect(getSpec("sc-slider")?.attrs.value).toMatchObject({
      type: "decimal",
      required: true,
      runtime: true,
    });
    expect(getSpec("sc-ugen")?.attrs.rate).toMatchObject({
      type: "enum",
      values: ["ar", "kr", "ir"],
      default: "ar",
    });
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
