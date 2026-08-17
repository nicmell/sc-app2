import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

// The `type` attribute maps to the component's `ugen` property (`attribute: "type"`).
export const spec: ElementSpec = {
  tag: "sc-ugen",
  category: "ugen",
  attrs: {
    name: { type: "name", required: true, runtime: false },
    type: { type: "string", required: true, runtime: false },
    rate: { type: "enum", values: ["ar", "kr", "ir"], runtime: false },
    op: { type: "string", runtime: false },
  },
  content: { choice: ["sc-control"] },
};
