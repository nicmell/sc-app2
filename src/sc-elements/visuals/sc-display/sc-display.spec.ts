import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-display",
  category: "visual",
  attrs: {
    value: { type: "scalar", runtime: true, required: true },
    format: { type: "string", runtime: true },
  },
};
