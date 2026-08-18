import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-scope",
  category: "widget",
  attrs: {
    // the tap trio is the SUBSCRIPTION identity — no re-tap machinery yet
    // SCOPE_INPUT_BUS is 0; specs stay pure JSON, so keep the literal here.
    bus: { type: "integer", min: 0, default: 0, runtime: false },
    // SCOPE_CHANNELS is 2; specs stay pure JSON, so keep the literal here.
    channels: { type: "integer", min: 1, default: 2, runtime: false },
    // SCOPE_CHUNK_SIZE is 1024; specs stay pure JSON, so keep the literal here.
    // 16384 is SCOPE_MAX_FRAMES; specs stay pure JSON, so keep the literal here.
    frames: { type: "integer", min: 1, max: 16384, default: 1024, runtime: false },
    // The former _trigger getter default.
    trigger: { type: "enum", values: ["auto", "normal", "off"], default: "auto" },
    // The former _slope getter default.
    slope: { type: "enum", values: ["rising", "falling"], default: "rising" },
    // The former _level getter default.
    level: { type: "decimal", default: 0 },
    // The former _gain getter default.
    gain: { type: "decimal", exclusiveMin: 0, default: 1 },
    // The former _layout getter default.
    layout: { type: "enum", values: ["overlay", "split"], default: "overlay" },
    // Display mapping: `bipolar` (default) draws ±1 around the band middle;
    // `unipolar` maps [0, 1] bottom→top — envelopes/control taps fill the
    // lane instead of squashing into the upper half.
    // The former _range getter default.
    range: { type: "enum", values: ["bipolar", "unipolar"], default: "bipolar" },
  },
};
