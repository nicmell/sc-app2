// The custom-element tags plugin HTML may use. Keep in sync with the backend
// XSD (src-tauri/src/plugin/xsd/sc-plugin-schema.xsd); sc-elements/index.ts
// registers one constructor per entry.
export const ELEMENTS = {
  SC_CONSOLE: "sc-console",
  SC_SCOPE: "sc-scope",
  SC_STRUDEL: "sc-strudel",
} as const;
