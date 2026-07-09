import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-radio",
  category: "option",
  attrs: {
    value: { type: "decimal", required: true },
    label: { type: "string", required: true },
  },
};
