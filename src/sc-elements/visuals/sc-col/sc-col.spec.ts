import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-col",
  category: "visual",
  attrs: {
    span: { type: "integer" },
    offset: { type: "integer" },
    order: { type: "integer" },
    push: { type: "integer" },
    pull: { type: "integer" },
    flex: { type: "string" },
  },
  content: { choice: ["blockContent"], mixed: true },
};
