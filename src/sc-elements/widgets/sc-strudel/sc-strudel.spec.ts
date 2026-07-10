import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-strudel",
  category: "widget",
  attrs: {
    orbit: { type: "integer", runtime: false },
  },
  content: { mixed: true },
};
