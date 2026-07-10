import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-row",
  category: "visual",
  attrs: {
    align: { type: "enum", values: ["top", "middle", "bottom", "stretch"] },
    justify: {
      type: "enum",
      values: ["start", "center", "end", "space-between", "space-around", "space-evenly"],
    },
    gutter: { type: "enum", values: ["none", "xs", "sm", "md", "lg"] },
    wrap: { type: "boolean" },
  },
  content: { choice: ["sc-col"], mixed: true },
};
