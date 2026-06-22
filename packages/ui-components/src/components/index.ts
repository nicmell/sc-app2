// Barrel + registration for the graphical `-base` Lit web components. Import
// the foundation CSS (@sc-app/ui-components) separately for styling; these are
// the behaviour/markup. Call registerUiComponents() once at startup to define
// the custom elements (idempotent), mirroring src/sc-elements/index.ts.

import { ScCheckboxBase } from "./sc-checkbox/sc-checkbox";
import { ScSwitchBase } from "./sc-switch/sc-switch";
import { ScKnobBase } from "./sc-knob/sc-knob";
import { ScSliderBase } from "./sc-slider/sc-slider";
import { ScOptionBase } from "./sc-option/sc-option";
import { ScRadioBase } from "./sc-radio/sc-radio";
import { ScRadioGroupBase } from "./sc-radio-group/sc-radio-group";
import { ScSelectBase } from "./sc-select/sc-select";
import { ScIconBase } from "./sc-icon/sc-icon";
import { ScButtonBase } from "./sc-button/sc-button";
import { ScBadgeBase } from "./sc-badge/sc-badge";
import { ScToastBase } from "./sc-toast/sc-toast";
import { ScChipBase } from "./sc-chip/sc-chip";
import { ScInputBase } from "./sc-input/sc-input";
import { ScInputNumberBase } from "./sc-inputnumber/sc-inputnumber";
import { ScTextareaBase } from "./sc-textarea/sc-textarea";
import { ScTextBase } from "./sc-text/sc-text";
import { ScPopoverBase } from "./sc-popover/sc-popover";
import { ScModalBase } from "./sc-modal/sc-modal";
import { ScDrawerBase } from "./sc-drawer/sc-drawer";
import { ScAlertBase } from "./sc-alert/sc-alert";
import { ScPanelBase } from "./sc-panel/sc-panel";
import { ScEmptyBase } from "./sc-empty/sc-empty";
import { ScStackBase } from "./sc-stack/sc-stack";
import { ScClusterBase } from "./sc-cluster/sc-cluster";
import { ScDisclosureBase } from "./sc-disclosure/sc-disclosure";
import { ScProgressBase } from "./sc-progress/sc-progress";

export { ScWidgetBase } from "./internal/sc-widget-base";
export type { ScSize, ScVariant } from "./internal/sc-widget-base";
export { ScRangeBase } from "./internal/sc-range-base";
export { ScCheckboxBase } from "./sc-checkbox/sc-checkbox";
export { ScSwitchBase } from "./sc-switch/sc-switch";
export { ScKnobBase } from "./sc-knob/sc-knob";
export { ScSliderBase } from "./sc-slider/sc-slider";
export { ScOptionBase } from "./sc-option/sc-option";
export { ScRadioBase } from "./sc-radio/sc-radio";
export { ScRadioGroupBase } from "./sc-radio-group/sc-radio-group";
export { ScSelectBase } from "./sc-select/sc-select";
export { ScIconBase, type ScIconSize } from "./sc-icon/sc-icon";
export { ScButtonBase, type ScButtonVariant } from "./sc-button/sc-button";
export { ScBadgeBase, type ScBadgeVariant } from "./sc-badge/sc-badge";
export { ScToastBase, type ScToastVariant } from "./sc-toast/sc-toast";
export { ScChipBase, type ScChipVariant } from "./sc-chip/sc-chip";
export { foundations, ensureTokens, adoptFoundation } from "./internal/foundation-styles";
export { PopoverController, type PopoverOptions } from "./internal/popover-controller";
export { ScPopoverBase } from "./sc-popover/sc-popover";
export { ScModalBase } from "./sc-modal/sc-modal";
export { ScDrawerBase, type ScDrawerSide } from "./sc-drawer/sc-drawer";
export { ScAlertBase, type ScAlertVariant } from "./sc-alert/sc-alert";
export { ScPanelBase } from "./sc-panel/sc-panel";
export { ScEmptyBase } from "./sc-empty/sc-empty";
export { ScStackBase, type ScGap } from "./sc-stack/sc-stack";
export { ScClusterBase } from "./sc-cluster/sc-cluster";
export { ScDisclosureBase } from "./sc-disclosure/sc-disclosure";
export {
  ScProgressBase,
  type ScProgressVariant,
  type ScProgressSize,
} from "./sc-progress/sc-progress";
export { ScInputBase, type ScInputSize } from "./sc-input/sc-input";
export { ScInputNumberBase } from "./sc-inputnumber/sc-inputnumber";
export { ScTextareaBase } from "./sc-textarea/sc-textarea";
export {
  ScTextBase,
  type ScTextSize,
  type ScTextWeight,
  type ScTextTone,
  type ScTextFont,
  type ScTextAlign,
} from "./sc-text/sc-text";

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
  "sc-popover-base": ScPopoverBase,
  "sc-modal-base": ScModalBase,
  "sc-drawer-base": ScDrawerBase,
  "sc-alert-base": ScAlertBase,
  "sc-panel-base": ScPanelBase,
  "sc-empty-base": ScEmptyBase,
  "sc-stack-base": ScStackBase,
  "sc-cluster-base": ScClusterBase,
  "sc-disclosure-base": ScDisclosureBase,
  "sc-progress-base": ScProgressBase,
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
    "sc-popover-base": ScPopoverBase;
    "sc-modal-base": ScModalBase;
    "sc-drawer-base": ScDrawerBase;
    "sc-alert-base": ScAlertBase;
    "sc-panel-base": ScPanelBase;
    "sc-empty-base": ScEmptyBase;
    "sc-stack-base": ScStackBase;
    "sc-cluster-base": ScClusterBase;
    "sc-disclosure-base": ScDisclosureBase;
    "sc-progress-base": ScProgressBase;
  }
}
