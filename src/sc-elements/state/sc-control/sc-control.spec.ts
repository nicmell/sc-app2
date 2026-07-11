import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-control",
  category: "state",
  attrs: {
    name: { type: "string", required: true, runtime: false },
    // graph inputs follow the same convention: value fixed, bind:value a
    // graph REFERENCE (consumed raw by the synthdef collectors)
    value: { type: "decimal" },
  },
};
