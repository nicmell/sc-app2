import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-checkbox",
  category: "input",
  attrs: {
    bind: { type: "string", required: true, runtime: false },
    label: { type: "string" },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean" },
  },
};
