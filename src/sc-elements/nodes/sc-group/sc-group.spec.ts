import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-group",
  category: "node",
  attrs: {
    name: { type: "string", required: true },
    run: { type: "boolean" },
  },
  content: { choice: ["blockContent"], mixed: true },
};
