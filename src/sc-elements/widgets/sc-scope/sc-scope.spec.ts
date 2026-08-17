import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-scope",
  category: "widget",
  attrs: {
    // the tap trio is the SUBSCRIPTION identity — no re-tap machinery yet
    bus: { type: "integer", min: 0, runtime: false },
    channels: { type: "integer", min: 1, runtime: false },
    // 16384 is SCOPE_MAX_FRAMES; specs stay pure JSON, so keep the literal here.
    frames: { type: "integer", min: 1, max: 16384, runtime: false },
    trigger: { type: "enum", values: ["auto", "normal", "off"] },
    slope: { type: "enum", values: ["rising", "falling"] },
    level: { type: "decimal" },
    gain: { type: "decimal", exclusiveMin: 0 },
    layout: { type: "enum", values: ["overlay", "split"] },
    // Display mapping: `bipolar` (default) draws ±1 around the band middle;
    // `unipolar` maps [0, 1] bottom→top — envelopes/control taps fill the
    // lane instead of squashing into the upper half.
    range: { type: "enum", values: ["bipolar", "unipolar"] },
  },
};
