import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-keyboard",
  category: "widget",
  attrs: {
    // The synthdef a pressed key spawns a voice from, and the param NAMES the
    // keyboard maps pitch / amplitude / gate onto — structural identity, not
    // bindable (like sc-scope's tap trio).
    synthdef: { type: "string", required: true, runtime: false },
    freq: { type: "string", default: "freq", runtime: false },
    amp: { type: "string", default: "amp", runtime: false },
    gate: { type: "string", default: "gate", runtime: false },
    // The per-voice envelope VALUE (an Env.asArray encoding) — typically
    // `bind:envelope` to a var an editor edits, or a fixed comma-list —
    // latched into each voice's /s_new on the def's single array param.
    envelope: { type: "vector", numeric: true },
    // The drawn range: `octaves` keys' worth from the leftmost MIDI note `start`.
    // The former _octaves getter default.
    octaves: { type: "integer", min: 1, default: 2, runtime: false },
    // The former _start getter default.
    start: { type: "integer", min: 0, max: 127, default: 60, runtime: false },
  },
};
