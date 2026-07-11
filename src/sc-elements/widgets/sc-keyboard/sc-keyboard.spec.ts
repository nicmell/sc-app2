import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-keyboard",
  category: "widget",
  attrs: {
    // The synthdef a pressed key spawns a voice from, and the param NAMES the
    // keyboard maps pitch / amplitude / gate onto — structural identity, not
    // bindable (like sc-scope's tap trio).
    synthdef: { type: "string", required: true, runtime: false },
    freq: { type: "string", runtime: false },
    amp: { type: "string", runtime: false },
    gate: { type: "string", runtime: false },
    // The drawn range: `octaves` keys' worth from the leftmost MIDI note `start`.
    octaves: { type: "integer", runtime: false },
    start: { type: "integer", runtime: false },
  },
};
