// Barrel for the sc-* custom elements (see README.md for the per-element
// docs). Re-exports every component plus `registerScElements`, which defines
// one constructor per tag in the `ELEMENTS` constant (`@/constants/
// sc-elements`, kept in sync with the backend XSD: src-tauri/src/plugin/xsd/
// sc-plugin-schema.xsd). Imported once at app boot (main.tsx) so injected
// plugin HTML upgrades.

import { ELEMENTS } from "@/constants/sc-elements";
import type { ScElementTagNames } from "@/types/sc-elements";
import { ScCheckbox } from "./inputs/sc-checkbox";
import { ScOption } from "./inputs/sc-option";
import { ScRadio } from "./inputs/sc-radio";
import { ScRadioGroup } from "./inputs/sc-radio-group";
import { ScRange } from "./inputs/sc-range";
import { ScRun } from "./inputs/sc-run";
import { ScSelect } from "./inputs/sc-select";
import { ScGroup } from "./nodes/sc-group";
import { ScPlugin } from "./nodes/sc-plugin";
import { ScSynth } from "./nodes/sc-synth";
import { ScControl } from "./state/sc-control";
import { ScVar } from "./state/sc-var";
import { ScSynthDef } from "./synthdef/sc-synthdef";
import { ScUgen } from "./synthdef/sc-ugen";
import { ScDisplay } from "./visuals/sc-display";
import { ScIf } from "./visuals/sc-if";
import { ScConsole } from "./widgets/sc-console";
import { ScScope } from "./widgets/sc-scope";
import { ScStrudel } from "./widgets/sc-strudel";

export { ScElement, type ScParentElement } from "./internal/sc-element";
export { ScNode } from "./internal/sc-node";
export { ScState } from "./internal/sc-state";
export { ScInput } from "./internal/sc-input";
export { ScGroup, ScPlugin, ScSynth };
export { ScSynthDef, ScUgen };
export { ScControl, ScVar };
export { ScCheckbox, ScOption, ScRadio, ScRadioGroup, ScRange, ScRun, ScSelect };
export { ScDisplay, ScIf };
export { ScConsole, ScScope, ScStrudel };

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
