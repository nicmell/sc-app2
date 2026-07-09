import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-knob",
  category: "input",
  attrs: {
    bind: { type: "string" },
    min: { type: "decimal", runtime: true },
    max: { type: "decimal", runtime: true },
    step: { type: "decimal", runtime: true },
    value: { type: "decimal" },
    label: { type: "string", runtime: true },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean", runtime: true },
  },
};
