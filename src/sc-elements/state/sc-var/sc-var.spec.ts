import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-var",
  category: "state",
  attrs: {
    name: { type: "string", required: true, runtime: false },
    // scalar: a literal var may hold a string (feeds displays/ternaries).
    value: { type: "scalar" },
  },
};
