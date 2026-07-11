import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-knob",
  category: "input",
  attrs: {
    min: { type: "decimal" },
    max: { type: "decimal" },
    step: { type: "decimal" },
    // the binding slot: bind:value="s1.freq" (writable when a plain path,
    // read-only meter when an expression); static value = a fixed widget
    value: { type: "decimal", required: true },
    label: { type: "string" },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean" },
  },
};
