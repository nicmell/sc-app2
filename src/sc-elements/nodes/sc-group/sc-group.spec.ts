import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-group",
  category: "node",
  attrs: {
    name: { type: "name", required: true, runtime: false },
    run: { type: "boolean", runtime: false },
  },
  content: { choice: ["blockContent"], mixed: true },
};
