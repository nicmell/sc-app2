import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-var",
  category: "state",
  attrs: {
    name: { type: "string", required: true, runtime: false },
    // vector: a literal var may hold a string (feeds displays/ternaries) or
    // a numeric ARRAY (comma-list; non-numeric comma strings stay strings).
    value: { type: "vector" },
  },
};
