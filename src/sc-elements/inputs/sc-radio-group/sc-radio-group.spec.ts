import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-radio-group",
  category: "input",
  attrs: {
    bind: { type: "string", required: true },
    orientation: { type: "enum", values: ["horizontal", "vertical"] },
    label: { type: "string" },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean" },
  },
  content: { choice: ["sc-radio"] },
};
