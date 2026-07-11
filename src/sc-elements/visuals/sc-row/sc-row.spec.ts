import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-row",
  category: "visual",
  attrs: {
    align: { type: "enum", values: ["top", "middle", "bottom", "stretch"] },
    gutter: { type: "enum", values: ["none", "xs", "sm", "md", "lg"] },
  },
  content: { choice: ["sc-col"], mixed: true },
};
