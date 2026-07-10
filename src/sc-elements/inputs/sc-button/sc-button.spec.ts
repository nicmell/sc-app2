import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

// A click commits `value` when given (fixed-value trigger), else toggles the
// bound state 0 ↔ 1 — hence bind is required (a bindless button has nothing
// to write to).
export const spec: ElementSpec = {
  tag: "sc-button",
  category: "input",
  attrs: {
    bind: { type: "string", required: true, runtime: false },
    value: { type: "decimal" },
    label: { type: "string" },
    icon: { type: "string" },
    variant: { type: "enum", values: ["primary", "secondary", "ghost", "danger"] },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean" },
  },
};
