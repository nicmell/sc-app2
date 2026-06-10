// Register the plugin custom elements — one constructor per tag in the
// `ELEMENTS` constant (`@/constants/sc-elements`, kept in sync with the backend
// XSD: src-tauri/src/plugin/xsd/sc-plugin-schema.xsd). Imported once at app
// boot (main.tsx) so injected plugin HTML upgrades.

import { ELEMENTS } from "@/constants/sc-elements";
import type { ScElementTagNames } from "@/types/sc-elements";
import { ScCheckbox } from "./sc-checkbox";
import { ScConsole } from "./sc-console";
import { ScControl } from "./sc-control";
import { ScDisplay } from "./sc-display";
import { ScGroup } from "./sc-group";
import { ScIf } from "./sc-if";
import { ScOption } from "./sc-option";
import { ScPlugin } from "./sc-plugin";
import { ScRadio } from "./sc-radio";
import { ScRadioGroup } from "./sc-radio-group";
import { ScRange } from "./sc-range";
import { ScRun } from "./sc-run";
import { ScScope } from "./sc-scope";
import { ScSelect } from "./sc-select";
import { ScStrudel } from "./sc-strudel";
import { ScSynth } from "./sc-synth";
import { ScSynthDef } from "./sc-synthdef";
import { ScUgen } from "./sc-ugen";
import { ScVar } from "./sc-var";

const REGISTRY: Record<ScElementTagNames, CustomElementConstructor> = {
  [ELEMENTS.SC_PLUGIN]: ScPlugin,
  [ELEMENTS.SC_GROUP]: ScGroup,
  [ELEMENTS.SC_SYNTHDEF]: ScSynthDef,
  [ELEMENTS.SC_UGEN]: ScUgen,
  [ELEMENTS.SC_CONTROL]: ScControl,
  [ELEMENTS.SC_VAR]: ScVar,
  [ELEMENTS.SC_SYNTH]: ScSynth,
  [ELEMENTS.SC_RANGE]: ScRange,
  [ELEMENTS.SC_CHECKBOX]: ScCheckbox,
  [ELEMENTS.SC_RUN]: ScRun,
  [ELEMENTS.SC_DISPLAY]: ScDisplay,
  [ELEMENTS.SC_IF]: ScIf,
  [ELEMENTS.SC_SELECT]: ScSelect,
  [ELEMENTS.SC_OPTION]: ScOption,
  [ELEMENTS.SC_RADIO_GROUP]: ScRadioGroup,
  [ELEMENTS.SC_RADIO]: ScRadio,
  [ELEMENTS.SC_CONSOLE]: ScConsole,
  [ELEMENTS.SC_SCOPE]: ScScope,
  [ELEMENTS.SC_STRUDEL]: ScStrudel,
};

/** Define the custom elements (idempotent — safe to call more than once). */
export function registerScElements(): void {
  for (const [tag, ctor] of Object.entries(REGISTRY)) {
    if (!customElements.get(tag)) customElements.define(tag, ctor);
  }
}
