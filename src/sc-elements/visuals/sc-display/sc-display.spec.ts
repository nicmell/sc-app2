import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-display",
  category: "visual",
  attrs: {
    value: { type: "scalar", required: true },
    format: { type: "string" },
  },
};
