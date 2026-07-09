import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

// The `type` attribute maps to the component's `ugen` property (`attribute: "type"`).
export const spec: ElementSpec = {
  tag: "sc-ugen",
  category: "ugen",
  attrs: {
    name: { type: "string", required: true },
    type: { type: "string", required: true },
    rate: { type: "string" },
    op: { type: "string" },
  },
  content: { choice: ["sc-control"] },
};
