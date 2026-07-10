import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-col",
  category: "visual",
  attrs: {
    span: { type: "integer", runtime: false },
    offset: { type: "integer", runtime: false },
    order: { type: "integer", runtime: false },
    push: { type: "integer", runtime: false },
    pull: { type: "integer", runtime: false },
    flex: { type: "string", runtime: false },
  },
  content: { choice: ["blockContent"], mixed: true },
};
