import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-scope",
  category: "widget",
  attrs: {
    bus: { type: "integer" },
    channels: { type: "integer" },
    frames: { type: "integer" },
    trigger: { type: "enum", values: ["auto", "normal", "off"] },
    slope: { type: "enum", values: ["rising", "falling"] },
    level: { type: "decimal" },
    gain: { type: "decimal" },
    layout: { type: "enum", values: ["overlay", "split"] },
  },
};
