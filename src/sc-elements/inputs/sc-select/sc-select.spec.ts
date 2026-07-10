import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-select",
  category: "input",
  attrs: {
    value: { type: "decimal", required: true },
    placeholder: { type: "string" },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean" },
  },
  content: { choice: ["sc-option"] },
};
