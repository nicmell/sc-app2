import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-strudel",
  category: "widget",
  attrs: {
    value: { type: "string" },
    orbit: { type: "integer", min: 0, runtime: false },
  },
};
