import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-scope",
  category: "widget",
  attrs: {
    // the tap trio is the SUBSCRIPTION identity — no re-tap machinery yet
    bus: { type: "integer", runtime: false },
    channels: { type: "integer", runtime: false },
    frames: { type: "integer", runtime: false },
    trigger: { type: "enum", values: ["auto", "normal", "off"] },
    slope: { type: "enum", values: ["rising", "falling"] },
    level: { type: "decimal" },
    gain: { type: "decimal" },
    layout: { type: "enum", values: ["overlay", "split"] },
  },
};
