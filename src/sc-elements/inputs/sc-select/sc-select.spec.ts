import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-select",
  category: "input",
  attrs: {
    bind: { type: "string", required: true, runtime: false },
    placeholder: { type: "string" },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean" },
  },
  content: { choice: ["sc-option"] },
};
