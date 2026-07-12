// The paren-aware comma split — the shared helper every consumer of
// comma-separated bind strings uses (compileSynthDef.resolveSignal, the
// sc-ugen ref gate): top-level commas separate channels, commas inside call
// parentheses belong to the call.

import { describe, expect, it } from "vitest";
import { splitTopLevel } from "@/lib/expression";

describe("splitTopLevel", () => {
  it("splits on top-level commas, trimming and dropping empties", () => {
    expect(splitTopLevel("a, b ,c")).toEqual(["a", "b", "c"]);
    expect(splitTopLevel(" one ")).toEqual(["one"]);
    expect(splitTopLevel("a,,b")).toEqual(["a", "b"]);
  });

  it("keeps commas inside call parentheses (nested included)", () => {
    expect(splitTopLevel("adsr(0.01, 0.1, 0.7, 0.3)")).toEqual(["adsr(0.01, 0.1, 0.7, 0.3)"]);
    expect(splitTopLevel("pad(adsr(0.01, 0.1), 36), gate")).toEqual([
      "pad(adsr(0.01, 0.1), 36)",
      "gate",
    ]);
    expect(splitTopLevel("(a + b) * 2, osc.1")).toEqual(["(a + b) * 2", "osc.1"]);
  });
});
