import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-select",
  category: "input",
  attrs: {
    bind: { type: "string", required: true },
    placeholder: { type: "string", runtime: true },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean", runtime: true },
  },
  content: { choice: ["sc-option"] },
};
