import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

// The `type` attribute names the UGen class; the component reads it via getProp("type").
export const spec: ElementSpec = {
  tag: "sc-ugen",
  category: "ugen",
  attrs: {
    name: { type: "name", required: true, runtime: false },
    type: { type: "string", required: true, runtime: false },
    // The default rate used by sc-synthdef's collector.
    rate: { type: "enum", values: ["ar", "kr", "ir"], default: "ar", runtime: false },
    op: { type: "string", runtime: false },
  },
  content: { choice: ["sc-control"] },
};
