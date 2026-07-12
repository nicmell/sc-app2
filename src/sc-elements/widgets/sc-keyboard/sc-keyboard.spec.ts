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
    // The per-voice envelope VALUE (an Env.asArray encoding) — typically
    // `bind:envelope` to a var an editor edits, or a fixed comma-list —
    // latched into each voice's /s_new on the def's single array param.
    envelope: { type: "vector" },
    // Loudness normalization for AMP envelopes: divide the voice's amp by
    // the latched envelope's peak |level|, so every drawn shape plays at
    // the same perceived level (velocity stays expressive). The classic
    // fixed-peak-ADSR behavior — leave off when the envelope drives pitch
    // or another non-amp destination.
    normalize: { type: "boolean", runtime: false },
    // The drawn range: `octaves` keys' worth from the leftmost MIDI note `start`.
    octaves: { type: "integer", runtime: false },
    start: { type: "integer", runtime: false },
  },
};
