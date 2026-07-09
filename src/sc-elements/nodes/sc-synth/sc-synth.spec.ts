import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-synth",
  category: "node",
  attrs: {
    name: { type: "string", required: true },
    bind: { type: "string" },
    run: { type: "boolean" },
  },
  content: { choice: ["sc-control"] },
};
