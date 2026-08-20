// The custom-element tags plugin HTML may use (plus sc-plugin, the authored
// entry root mounted directly by PluginHost).
// Keep in sync with the sc-validate crate's spec registry (specs/<tag>.spec.json
// + SPEC_SOURCES — the wasm-specs vitest pins the bijection); sc-elements/index.ts
// registers one constructor per entry.
export const ELEMENTS = {
  SC_PLUGIN: "sc-plugin",
  SC_GROUP: "sc-group",
  SC_SYNTHDEF: "sc-synthdef",
  SC_UGEN: "sc-ugen",
  SC_CONTROL: "sc-control",
  SC_VAR: "sc-var",
  SC_SYNTH: "sc-synth",
  SC_SLIDER: "sc-slider",
  SC_ENVELOPE: "sc-envelope",
  SC_KNOB: "sc-knob",
  SC_BUTTON: "sc-button",
  SC_CHECKBOX: "sc-checkbox",
  SC_SWITCH: "sc-switch",
  SC_DISPLAY: "sc-display",
  SC_IF: "sc-if",
  SC_TEXT: "sc-text",
  SC_FLEX: "sc-flex",
  SC_ROW: "sc-row",
  SC_COL: "sc-col",
  SC_SELECT: "sc-select",
  SC_OPTION: "sc-option",
  SC_RADIO_GROUP: "sc-radio-group",
  SC_RADIO: "sc-radio",
  SC_CONSOLE: "sc-console",
  SC_SCOPE: "sc-scope",
  SC_STRUDEL: "sc-strudel",
  SC_KEYBOARD: "sc-keyboard",
} as const;
