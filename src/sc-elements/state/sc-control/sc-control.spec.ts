import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-control",
  category: "state",
  attrs: {
    name: { type: "string", required: true },
    value: { type: "decimal" },
    bind: { type: "string" },
  },
};
