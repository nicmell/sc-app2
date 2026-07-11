import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-synthdef",
  category: "synthdef",
  attrs: {
    name: { type: "string", required: true, runtime: false },
  },
  content: { choice: ["sc-control", "sc-ugen"] },
};
