import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-plugin",
  category: "root",
  attrs: {
    title: { type: "string", runtime: false },
    description: { type: "string", runtime: false },
  },
  content: { choice: ["blockContent"] },
};
