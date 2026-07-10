import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-synth",
  category: "node",
  attrs: {
    name: { type: "string", required: true, runtime: false },
    bind: { type: "string", runtime: false },
    run: { type: "boolean", runtime: false },
  },
  content: { choice: ["sc-control"] },
};
