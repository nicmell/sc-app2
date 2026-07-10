import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-slider",
  category: "input",
  attrs: {
    bind: { type: "string", runtime: false },
    min: { type: "decimal" },
    max: { type: "decimal" },
    step: { type: "decimal" },
    // the widget-reactive value is fed by the bind target, never evaluated
    value: { type: "decimal", runtime: false },
    label: { type: "string" },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    orientation: { type: "enum", values: ["horizontal", "vertical"] },
    disabled: { type: "boolean" },
  },
};
