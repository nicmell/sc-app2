import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-control",
  category: "state",
  attrs: {
    name: { type: "string", required: true, runtime: false },
    // graph inputs follow the same convention: value fixed, bind:value a
    // graph REFERENCE (consumed raw by the synthdef collectors). A comma-list
    // value is an ARRAY (a control-array param / array-valued state).
    value: { type: "vector" },
  },
};
