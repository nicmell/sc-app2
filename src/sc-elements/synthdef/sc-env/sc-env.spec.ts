import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

// Parse-time data (like sc-option): an envelope for an EnvGen ugen, collected
// by the enclosing sc-synthdef and encoded into the `envelope` input. All attrs
// are structural (never bindable): the MVP encodes CONSTANT envelopes.
export const spec: ElementSpec = {
  tag: "sc-env",
  category: "envelope",
  attrs: {
    shape: { type: "enum", values: ["adsr", "perc", "asr"], required: true, runtime: false },
    attack: { type: "decimal", runtime: false },
    decay: { type: "decimal", runtime: false },
    sustain: { type: "decimal", runtime: false },
    release: { type: "decimal", runtime: false },
    peak: { type: "decimal", runtime: false },
    level: { type: "decimal", runtime: false },
    // number ("-4") or a symbolic shape name ("exp", "lin", "sin", …).
    curve: { type: "scalar", runtime: false },
  },
};
