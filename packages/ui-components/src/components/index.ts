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
import { ScFlexBase } from "./sc-flex/sc-flex";
import { ScRowBase } from "./sc-row/sc-row";
import { ScColBase } from "./sc-col/sc-col";
import { ScDisclosureBase } from "./sc-disclosure/sc-disclosure";
import { ScProgressBase } from "./sc-progress/sc-progress";

export { ScControlBase } from "./internal/sc-control/sc-control";
export type { ScSize } from "./internal/sc-control/sc-control";
export { ScRangeBase } from "./internal/sc-range/sc-range";
export { ScCheckboxBase } from "./sc-checkbox/sc-checkbox";
export { ScSwitchBase } from "./sc-switch/sc-switch";
export { ScKnobBase } from "./sc-knob/sc-knob";
export { ScSliderBase } from "./sc-slider/sc-slider";
export { ScOptionBase } from "./sc-option/sc-option";
export { ScRadioBase } from "./sc-radio/sc-radio";
export { ScRadioGroupBase } from "./sc-radio-group/sc-radio-group";
export { ScSelectBase } from "./sc-select/sc-select";
export { ScIconBase, type ScIconSize, type ScIconVariant } from "./sc-icon/sc-icon";
export { ScButtonBase, type ScButtonVariant } from "./sc-button/sc-button";
export { ScBadgeBase, type ScBadgeVariant } from "./sc-badge/sc-badge";
export { ScToastBase, type ScToastVariant } from "./sc-toast/sc-toast";
export { ScChipBase, type ScChipVariant } from "./sc-chip/sc-chip";
export { ScPopoverBase } from "./sc-popover/sc-popover";
export { type PopoverPlacement } from "./sc-popover/position";
export { ScModalBase } from "./sc-modal/sc-modal";
export { ScDrawerBase, type ScDrawerSide } from "./sc-drawer/sc-drawer";
export { ScAlertBase, type ScAlertVariant } from "./sc-alert/sc-alert";
export { ScPanelBase } from "./sc-panel/sc-panel";
export { ScEmptyBase } from "./sc-empty/sc-empty";
export {
  ScFlexBase,
  type ScFlexOrientation,
  type ScFlexJustify,
  type ScFlexAlign,
  type ScGap,
} from "./sc-flex/sc-flex";
export { ScRowBase, type ScRowAlign } from "./sc-row/sc-row";
export { ScColBase } from "./sc-col/sc-col";
export { ScDisclosureBase } from "./sc-disclosure/sc-disclosure";
export {
  ScProgressBase,
  type ScProgressVariant,
  type ScProgressSize,
} from "./sc-progress/sc-progress";
export { ScInputBase } from "./sc-input/sc-input";
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
  "sc-base-checkbox": ScCheckboxBase,
  "sc-base-switch": ScSwitchBase,
  "sc-base-knob": ScKnobBase,
  "sc-base-slider": ScSliderBase,
  // Context providers must be defined BEFORE their consumers so that, when a
  // page's existing markup upgrades, the provider is listening before a child
  // requests context (radio-group before radio; select before option).
  "sc-base-radio-group": ScRadioGroupBase,
  "sc-base-radio": ScRadioBase,
  "sc-base-select": ScSelectBase,
  "sc-base-option": ScOptionBase,
  "sc-base-icon": ScIconBase,
  "sc-base-button": ScButtonBase,
  "sc-base-badge": ScBadgeBase,
  "sc-base-toast": ScToastBase,
  "sc-base-chip": ScChipBase,
  "sc-base-input": ScInputBase,
  "sc-base-inputnumber": ScInputNumberBase,
  "sc-base-textarea": ScTextareaBase,
  "sc-base-text": ScTextBase,
  "sc-base-popover": ScPopoverBase,
  "sc-base-modal": ScModalBase,
  "sc-base-drawer": ScDrawerBase,
  "sc-base-alert": ScAlertBase,
  "sc-base-panel": ScPanelBase,
  "sc-base-empty": ScEmptyBase,
  "sc-base-flex": ScFlexBase,
  "sc-base-row": ScRowBase,
  "sc-base-col": ScColBase,
  "sc-base-disclosure": ScDisclosureBase,
  "sc-base-progress": ScProgressBase,
} as const satisfies Record<string, CustomElementConstructor>;

/** Define every `-base` custom element (idempotent — safe to call repeatedly). */
export function registerUiComponents(): void {
  for (const [tag, ctor] of Object.entries(REGISTRY)) {
    if (!customElements.get(tag)) customElements.define(tag, ctor);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sc-base-checkbox": ScCheckboxBase;
    "sc-base-switch": ScSwitchBase;
    "sc-base-knob": ScKnobBase;
    "sc-base-slider": ScSliderBase;
    "sc-base-option": ScOptionBase;
    "sc-base-radio": ScRadioBase;
    "sc-base-radio-group": ScRadioGroupBase;
    "sc-base-select": ScSelectBase;
    "sc-base-icon": ScIconBase;
    "sc-base-button": ScButtonBase;
    "sc-base-badge": ScBadgeBase;
    "sc-base-toast": ScToastBase;
    "sc-base-chip": ScChipBase;
    "sc-base-input": ScInputBase;
    "sc-base-inputnumber": ScInputNumberBase;
    "sc-base-textarea": ScTextareaBase;
    "sc-base-text": ScTextBase;
    "sc-base-popover": ScPopoverBase;
    "sc-base-modal": ScModalBase;
    "sc-base-drawer": ScDrawerBase;
    "sc-base-alert": ScAlertBase;
    "sc-base-panel": ScPanelBase;
    "sc-base-empty": ScEmptyBase;
    "sc-base-flex": ScFlexBase;
    "sc-base-row": ScRowBase;
    "sc-base-col": ScColBase;
    "sc-base-disclosure": ScDisclosureBase;
    "sc-base-progress": ScProgressBase;
  }
}
