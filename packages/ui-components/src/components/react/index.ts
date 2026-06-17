// React wrappers for the graphical `-base` widgets, built with @lit/react's
// createComponent over the SAME Lit elements (no reimplementation). Importing
// this barrel registers the underlying custom elements so the wrappers render.
//
// Events are NATIVE: form-backed widgets fire the real `input`/`change`
// (read `e.target.value` / `.checked`); containers (select / radio-group) fire
// `change` from the host. `onChange`/`onInput` map to those. Props (value, min,
// max, step, checked, size, variant, disabled, orientation, …) map straight to
// the element's reactive properties; option/radio compose as children.

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
export { ScPopover } from "./sc-popover";
export { ScModal } from "./sc-modal";
export { ScDrawer } from "./sc-drawer";
export { ScAlert } from "./sc-alert";
export { ScPanel } from "./sc-panel";
export { ScEmpty } from "./sc-empty";
export { ScStack } from "./sc-stack";
export { ScCluster } from "./sc-cluster";
export { ScDisclosure } from "./sc-disclosure";
