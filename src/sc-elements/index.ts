// Register the three plugin custom elements. Imported once at app boot (main.tsx)
// so injected plugin HTML upgrades. Keep this list in sync with the backend XSD
// (src-tauri/src/plugin/xsd/sc-plugin-schema.xsd).

import { ScConsole } from "./sc-console";
import { ScScope } from "./sc-scope";
import { ScStrudel } from "./sc-strudel";

const ELEMENTS: Record<string, CustomElementConstructor> = {
  "sc-console": ScConsole,
  "sc-scope": ScScope,
  "sc-strudel": ScStrudel,
};

/** Define the custom elements (idempotent — safe to call more than once). */
export function registerScElements(): void {
  for (const [tag, ctor] of Object.entries(ELEMENTS)) {
    if (!customElements.get(tag)) customElements.define(tag, ctor);
  }
}
