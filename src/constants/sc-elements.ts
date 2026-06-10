// The custom-element tags plugin HTML may use (plus sc-plugin, the
// app-synthesized root PluginHost mounts — never written in plugin HTML).
// Keep in sync with the backend XSD (src-tauri/src/plugin/xsd/
// sc-plugin-schema.xsd); sc-elements/index.ts registers one constructor per
// entry, and the parser (lib/html) accepts exactly these types.
export const ELEMENTS = {
  SC_PLUGIN: "sc-plugin",
  SC_SYNTHDEF: "sc-synthdef",
  SC_UGEN: "sc-ugen",
  SC_CONTROL: "sc-control",
  SC_SYNTH: "sc-synth",
  SC_RANGE: "sc-range",
  SC_CONSOLE: "sc-console",
  SC_SCOPE: "sc-scope",
  SC_STRUDEL: "sc-strudel",
} as const;
