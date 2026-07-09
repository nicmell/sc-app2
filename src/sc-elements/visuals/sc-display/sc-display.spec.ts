import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-display",
  category: "visual",
  attrs: {
    bind: { type: "string", required: true },
    format: { type: "string" },
  },
};
