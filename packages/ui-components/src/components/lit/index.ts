// Barrel + registration for the graphical `-base` Lit web components. Import
// the foundation CSS (@sc-app/ui-components) separately for styling; these are
// the behaviour/markup. Call registerUiComponents() once at startup to define
// the custom elements (idempotent), mirroring src/sc-elements/index.ts.

import { ScCheckboxBase } from "./sc-checkbox";
import { ScSwitchBase } from "./sc-switch";
import { ScKnobBase } from "./sc-knob";
import { ScSliderBase } from "./sc-slider";
import { ScOptionBase } from "./sc-option";
import { ScRadioBase } from "./sc-radio";
import { ScRadioGroupBase } from "./sc-radio-group";
import { ScSelectBase } from "./sc-select";
import { ScIconBase } from "./sc-icon";
import { ScButtonBase } from "./sc-button";
import { ScBadgeBase } from "./sc-badge";
import { ScToastBase } from "./sc-toast";
import { ScChipBase } from "./sc-chip";
import { ScInputBase } from "./sc-input";
import { ScInputNumberBase } from "./sc-inputnumber";
import { ScTextareaBase } from "./sc-textarea";
import { ScTextBase } from "./sc-text";

export { ScWidgetBase } from "./internal/sc-widget-base";
export type { ScSize, ScVariant } from "./internal/sc-widget-base";
export { ScCheckboxBase } from "./sc-checkbox";
export { ScSwitchBase } from "./sc-switch";
export { ScKnobBase } from "./sc-knob";
export { ScSliderBase } from "./sc-slider";
export { ScOptionBase } from "./sc-option";
export { ScRadioBase } from "./sc-radio";
export { ScRadioGroupBase } from "./sc-radio-group";
export { ScSelectBase } from "./sc-select";
export { ScIconBase, type ScIconSize } from "./sc-icon";
export { ScButtonBase, type ScButtonVariant } from "./sc-button";
export { ScBadgeBase, type ScBadgeVariant } from "./sc-badge";
export { ScToastBase, type ScToastVariant } from "./sc-toast";
export { ScChipBase, type ScChipVariant } from "./sc-chip";
export { foundationStyles, adoptFoundation } from "./internal/foundation-styles";
export { ScInputBase, type ScInputSize } from "./sc-input";
export { ScInputNumberBase } from "./sc-inputnumber";
export { ScTextareaBase } from "./sc-textarea";
export {
  ScTextBase,
  type ScTextSize,
  type ScTextWeight,
  type ScTextTone,
  type ScTextFont,
  type ScTextAlign,
} from "./sc-text";

/** Tag → constructor for every registrable `-base` widget. */
export const REGISTRY = {
  "sc-checkbox-base": ScCheckboxBase,
  "sc-switch-base": ScSwitchBase,
  "sc-knob-base": ScKnobBase,
  "sc-slider-base": ScSliderBase,
  // Context providers must be defined BEFORE their consumers so that, when a
  // page's existing markup upgrades, the provider is listening before a child
  // requests context (radio-group before radio; select before option).
  "sc-radio-group-base": ScRadioGroupBase,
  "sc-radio-base": ScRadioBase,
  "sc-select-base": ScSelectBase,
  "sc-option-base": ScOptionBase,
  "sc-icon-base": ScIconBase,
  "sc-button-base": ScButtonBase,
  "sc-badge-base": ScBadgeBase,
  "sc-toast-base": ScToastBase,
  "sc-chip-base": ScChipBase,
  "sc-input-base": ScInputBase,
  "sc-inputnumber-base": ScInputNumberBase,
  "sc-textarea-base": ScTextareaBase,
  "sc-text-base": ScTextBase,
} as const satisfies Record<string, CustomElementConstructor>;

/** Define every `-base` custom element (idempotent — safe to call repeatedly). */
export function registerUiComponents(): void {
  for (const [tag, ctor] of Object.entries(REGISTRY)) {
    if (!customElements.get(tag)) customElements.define(tag, ctor);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sc-checkbox-base": ScCheckboxBase;
    "sc-switch-base": ScSwitchBase;
    "sc-knob-base": ScKnobBase;
    "sc-slider-base": ScSliderBase;
    "sc-option-base": ScOptionBase;
    "sc-radio-base": ScRadioBase;
    "sc-radio-group-base": ScRadioGroupBase;
    "sc-select-base": ScSelectBase;
    "sc-icon-base": ScIconBase;
    "sc-button-base": ScButtonBase;
    "sc-badge-base": ScBadgeBase;
    "sc-toast-base": ScToastBase;
    "sc-chip-base": ScChipBase;
    "sc-input-base": ScInputBase;
    "sc-inputnumber-base": ScInputNumberBase;
    "sc-textarea-base": ScTextareaBase;
    "sc-text-base": ScTextBase;
  }
}
