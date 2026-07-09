import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-option",
  category: "option",
  attrs: {
    value: { type: "decimal", required: true },
    label: { type: "string", required: true },
  },
};
