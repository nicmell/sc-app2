import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-knob",
  category: "input",
  attrs: {
    bind: { type: "string" },
    min: { type: "decimal" },
    max: { type: "decimal" },
    step: { type: "decimal" },
    value: { type: "decimal" },
    label: { type: "string" },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean" },
  },
};
