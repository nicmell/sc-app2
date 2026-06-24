// React wrappers for the graphical `-base` widgets, built with @lit/react's
// createComponent over the SAME Lit elements (no reimplementation). Importing
// this module registers the underlying custom elements so the wrappers render.
//
// Events: every component is shadow DOM, so the form widgets re-emit a composed
// `input`/`change` from the host (read `e.target.value` / `.checked`); containers
// (select / radio-group) fire `change` from the host. The genuinely-custom events
// are mapped explicitly via `events:` (toast `dismiss`, modal/drawer `close`,
// popover/disclosure `toggle`). Props (value, min, max, step, checked, size,
// variant, disabled, orientation, label, …) map straight to the elements'
// reactive properties; option/radio compose as children.
//
// One file by design: each wrapper is a one-liner, so a folder of 26 files
// added only noise.

import * as React from "react";
import { createComponent } from "@lit/react";
import {
  registerUiComponents,
  ScCheckboxBase,
  ScSwitchBase,
  ScKnobBase,
  ScSliderBase,
  ScOptionBase,
  ScRadioBase,
  ScRadioGroupBase,
  ScSelectBase,
  ScIconBase,
  ScButtonBase,
  ScBadgeBase,
  ScToastBase,
  ScChipBase,
  ScInputBase,
  ScInputNumberBase,
  ScTextareaBase,
  ScTextBase,
  ScPopoverBase,
  ScModalBase,
  ScDrawerBase,
  ScAlertBase,
  ScPanelBase,
  ScEmptyBase,
  ScStackBase,
  ScClusterBase,
  ScDisclosureBase,
  ScProgressBase,
} from "./index";

registerUiComponents();

/** <sc-checkbox-base>. `onChange` is the native change; read `e.target.checked`. */
export const ScCheckbox = createComponent({
  react: React,
  tagName: "sc-checkbox-base",
  elementClass: ScCheckboxBase,
  events: { onChange: "change" },
});

/** <sc-switch-base>. `onChange` is the native change; read `e.target.checked`. */
export const ScSwitch = createComponent({
  react: React,
  tagName: "sc-switch-base",
  elementClass: ScSwitchBase,
  events: { onChange: "change" },
});

/** <sc-knob-base>. `onInput` (live) / `onChange` (commit) are the native range
 *  events; read `e.target.value`. `label` sets the accessible name. */
export const ScKnob = createComponent({
  react: React,
  tagName: "sc-knob-base",
  elementClass: ScKnobBase,
  events: { onChange: "change", onInput: "input" },
});

/** <sc-slider-base>. `onInput` (live) / `onChange` (commit) are the native range
 *  events; read `e.target.value`. `label` sets the accessible name. */
export const ScSlider = createComponent({
  react: React,
  tagName: "sc-slider-base",
  elementClass: ScSliderBase,
  events: { onChange: "change", onInput: "input" },
});

/** <sc-option-base>. Reports selection to its <ScSelect> through context (no own
 *  event). Use as a child: <ScSelect><ScOption value={0} label="…" /></ScSelect>. */
export const ScOption = createComponent({
  react: React,
  tagName: "sc-option-base",
  elementClass: ScOptionBase,
});

/** <sc-radio-base>. Use inside <ScRadioGroup>; reports selection via context. */
export const ScRadio = createComponent({
  react: React,
  tagName: "sc-radio-base",
  elementClass: ScRadioBase,
});

/** <sc-radio-group-base>. Pass <ScRadio> children; selection + size/variant/
 *  disabled flow via context. `onChange` is the group change; read
 *  `e.target.value`. `label` names the role=radiogroup. */
export const ScRadioGroup = createComponent({
  react: React,
  tagName: "sc-radio-group-base",
  elementClass: ScRadioGroupBase,
  events: { onChange: "change" },
});

/** <sc-select-base>. Pass <ScOption> children (declarative). `onChange` is the
 *  select's change; read `e.target.value`. */
export const ScSelect = createComponent({
  react: React,
  tagName: "sc-select-base",
  elementClass: ScSelectBase,
  events: { onChange: "change" },
});

/** <sc-icon-base>. Pass a Phosphor icon `name` + optional `variant`
 *  (regular | fill | duotone). The weights are bundled by the package — no host
 *  setup needed. */
export const ScIcon = createComponent({
  react: React,
  tagName: "sc-icon-base",
  elementClass: ScIconBase,
});

/** <sc-button-base>. Standard React `onClick` (native click bubbles from the
 *  inner button). `icon`/`trailingIcon` are Phosphor names; `iconOnly` makes an
 *  icon button (set `label` as the accessible name). */
export const ScButton = createComponent({
  react: React,
  tagName: "sc-button-base",
  elementClass: ScButtonBase,
});

/** <sc-badge-base>. */
export const ScBadge = createComponent({
  react: React,
  tagName: "sc-badge-base",
  elementClass: ScBadgeBase,
});

/** <sc-toast-base>. `onDismiss` fires when the close button is clicked; the
 *  owner removes the toast from its list. */
export const ScToast = createComponent({
  react: React,
  tagName: "sc-toast-base",
  elementClass: ScToastBase,
  events: { onDismiss: "dismiss" },
});

/** <sc-chip-base>. */
export const ScChip = createComponent({
  react: React,
  tagName: "sc-chip-base",
  elementClass: ScChipBase,
});

/** <sc-input-base>. `onInput` (live) / `onChange` (commit) native input events;
 *  read `e.target.value`. */
export const ScInput = createComponent({
  react: React,
  tagName: "sc-input-base",
  elementClass: ScInputBase,
  events: { onChange: "change", onInput: "input" },
});

/** <sc-inputnumber-base>. `onInput` (live) / `onChange` (commit/step) native
 *  input events; read `e.target.value`. */
export const ScInputNumber = createComponent({
  react: React,
  tagName: "sc-inputnumber-base",
  elementClass: ScInputNumberBase,
  events: { onChange: "change", onInput: "input" },
});

/** <sc-textarea-base>. `onInput` (live) / `onChange` (commit) native textarea
 *  events; read `e.target.value`. */
export const ScTextarea = createComponent({
  react: React,
  tagName: "sc-textarea-base",
  elementClass: ScTextareaBase,
  events: { onChange: "change", onInput: "input" },
});

/** <sc-text-base>. Pass text/inline content as children; style via
 *  size/weight/tone/font/align (+ truncate/inline). */
export const ScText = createComponent({
  react: React,
  tagName: "sc-text-base",
  elementClass: ScTextBase,
});

/** <sc-popover-base>. Control via `open`; `onToggle` fires when it opens/closes
 *  (incl. native light-dismiss) — read `e.target.open`. Set `anchor` (an
 *  element) or place a trigger right before it. */
export const ScPopover = createComponent({
  react: React,
  tagName: "sc-popover-base",
  elementClass: ScPopoverBase,
  events: { onToggle: "toggle" },
});

/** <sc-modal-base>. Render only while visible with `open`; `dismissable` allows
 *  Esc/backdrop close. `onClose` fires on every dismissal — typically unmounts
 *  it. `label` is the dialog's accessible name. */
export const ScModal = createComponent({
  react: React,
  tagName: "sc-modal-base",
  elementClass: ScModalBase,
  events: { onClose: "close" },
});

/** <sc-drawer-base>. Render always-mounted and toggle `open`; set `side`
 *  (right | left) and `dismissable`. `onClose` fires on every dismissal. A
 *  direct-child <header> is the title bar; `label` is the accessible name. */
export const ScDrawer = createComponent({
  react: React,
  tagName: "sc-drawer-base",
  elementClass: ScDrawerBase,
  events: { onClose: "close" },
});

/** <sc-alert-base>. Pass the message as children; set `variant`
 *  (info | success | warn | error). */
export const ScAlert = createComponent({
  react: React,
  tagName: "sc-alert-base",
  elementClass: ScAlertBase,
});

/** <sc-panel-base>. A direct-child <header> becomes the title bar; the rest is
 *  gap-stacked content. `disabled` mutes the card. */
export const ScPanel = createComponent({
  react: React,
  tagName: "sc-panel-base",
  elementClass: ScPanelBase,
});

/** <sc-empty-base>. Pass the placeholder message as children. */
export const ScEmpty = createComponent({
  react: React,
  tagName: "sc-empty-base",
  elementClass: ScEmptyBase,
});

/** <sc-stack-base>. Pass items as children; `gap` (xs | sm | md | lg) selects
 *  spacing. */
export const ScStack = createComponent({
  react: React,
  tagName: "sc-stack-base",
  elementClass: ScStackBase,
});

/** <sc-cluster-base>. Pass items as children; `gap` (xs | sm | md | lg) selects
 *  spacing. */
export const ScCluster = createComponent({
  react: React,
  tagName: "sc-cluster-base",
  elementClass: ScClusterBase,
});

/** <sc-disclosure-base>. Put the summary in a `slot="summary"` child and the
 *  body in the default children; control `open` and read `onToggle`. */
export const ScDisclosure = createComponent({
  react: React,
  tagName: "sc-disclosure-base",
  elementClass: ScDisclosureBase,
  events: { onToggle: "toggle" },
});

/** <sc-progress-base>. A loading/progress indicator: `variant` (bar | spinner),
 *  `size` (sm | md | lg). Omit `value` for an indeterminate spinner/bar; set
 *  `value` (0…`max`) for a determinate one. `label` is the accessible name. */
export const ScProgress = createComponent({
  react: React,
  tagName: "sc-progress-base",
  elementClass: ScProgressBase,
});
