// React wrappers for the graphical `-base` widgets, built with @lit/react's
// createComponent over the SAME Lit elements (no reimplementation). Importing
// this barrel registers the underlying custom elements so the wrappers render.
//
// Every wrapper exposes an `onChange` prop receiving the `change` CustomEvent;
// read the new value from `e.detail.value`. Variant/size/disabled (and per-
// widget props like value/min/max/step/options/orientation) map straight to the
// element's reactive properties.

import { registerUiComponents } from "../lit";

registerUiComponents();

export { ScCheckbox } from "./sc-checkbox";
export { ScSwitch } from "./sc-switch";
export { ScKnob } from "./sc-knob";
export { ScSlider } from "./sc-slider";
export { ScOption } from "./sc-option";
export { ScRadio } from "./sc-radio";
export { ScRadioGroup } from "./sc-radio-group";
export { ScSelect } from "./sc-select";
export { ScIcon } from "./sc-icon";
export { ScButton } from "./sc-button";
export { ScBadge } from "./sc-badge";
export { ScToast } from "./sc-toast";
export { ScChip } from "./sc-chip";
export { ScInput } from "./sc-input";
export { ScInputNumber } from "./sc-inputnumber";
export { ScTextarea } from "./sc-textarea";
export { ScText } from "./sc-text";
