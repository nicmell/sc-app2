import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

// A click commits `set` when given (a fixed-value trigger), else toggles
// the bound state 0 ↔ 1. Buttons are write-only, so `bind:value` must be a
// plain writable path (the resolveRuntime override rejects the rest).
export const spec: ElementSpec = {
  tag: "sc-button",
  category: "input",
  attrs: {
    value: { type: "decimal", required: true },
    set: { type: "decimal" },
    label: { type: "string" },
    icon: { type: "string" },
    variant: { type: "enum", values: ["primary", "secondary", "ghost", "danger"] },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean" },
  },
};
