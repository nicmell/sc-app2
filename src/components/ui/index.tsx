// React wrappers for the `-base` widgets, built with @lit/react's createComponent
// over the SAME Lit elements (no reimplementation). This is the app's React glue —
// @sc-app/ui-components stays framework-agnostic (pure Lit + CSS); the React binding
// lives here. Importing this module registers the underlying custom elements so the
// wrappers render.
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
  ScFlexBase,
  ScRowBase,
  ScColBase,
  ScDisclosureBase,
  ScProgressBase,
} from "@sc-app/ui-components/lit";

registerUiComponents();

/** <sc-base-checkbox>. `onChange` is the native change; read `e.target.checked`. */
export const Checkbox = createComponent({
  react: React,
  tagName: "sc-base-checkbox",
  elementClass: ScCheckboxBase,
  events: { onChange: "change" },
});

/** <sc-base-switch>. `onChange` is the native change; read `e.target.checked`. */
export const Switch = createComponent({
  react: React,
  tagName: "sc-base-switch",
  elementClass: ScSwitchBase,
  events: { onChange: "change" },
});

/** <sc-base-knob>. `onInput` (live) / `onChange` (commit) are the native range
 *  events; read `e.target.value`. `label` sets the accessible name. */
export const Knob = createComponent({
  react: React,
  tagName: "sc-base-knob",
  elementClass: ScKnobBase,
  events: { onChange: "change", onInput: "input" },
});

/** <sc-base-slider>. `onInput` (live) / `onChange` (commit) are the native range
 *  events; read `e.target.value`. `label` sets the accessible name. */
export const Slider = createComponent({
  react: React,
  tagName: "sc-base-slider",
  elementClass: ScSliderBase,
  events: { onChange: "change", onInput: "input" },
});

/** <sc-base-option>. Reports selection to its <Select> through context (no own
 *  event). Use as a child: <Select><Option value={0} label="…" /></Select>. */
export const Option = createComponent({
  react: React,
  tagName: "sc-base-option",
  elementClass: ScOptionBase,
});

/** <sc-base-radio>. Use inside <RadioGroup>; reports selection via context. */
export const Radio = createComponent({
  react: React,
  tagName: "sc-base-radio",
  elementClass: ScRadioBase,
});

/** <sc-base-radio-group>. Pass <Radio> children; selection + size/disabled flow
 *  via context. `onChange` is the group change; read `e.target.value`. `label` names
 *  the role=radiogroup. */
export const RadioGroup = createComponent({
  react: React,
  tagName: "sc-base-radio-group",
  elementClass: ScRadioGroupBase,
  events: { onChange: "change" },
});

/** <sc-base-select>. Pass <Option> children (declarative). `onChange` is the
 *  select's change; read `e.target.value`. */
export const Select = createComponent({
  react: React,
  tagName: "sc-base-select",
  elementClass: ScSelectBase,
  events: { onChange: "change" },
});

/** <sc-base-icon>. Pass a Phosphor icon `name` + optional `variant`
 *  (regular | fill | duotone). The weights are bundled by the package — no host
 *  setup needed. */
export const Icon = createComponent({
  react: React,
  tagName: "sc-base-icon",
  elementClass: ScIconBase,
});

/** <sc-base-button>. Standard React `onClick` (native click bubbles from the
 *  inner button). `icon`/`trailingIcon` are Phosphor names; `iconOnly` makes an
 *  icon button (set `label` as the accessible name). */
export const Button = createComponent({
  react: React,
  tagName: "sc-base-button",
  elementClass: ScButtonBase,
});

/** <sc-base-badge>. */
export const Badge = createComponent({
  react: React,
  tagName: "sc-base-badge",
  elementClass: ScBadgeBase,
});

/** <sc-base-toast>. `onDismiss` fires when the close button is clicked; the
 *  owner removes the toast from its list. */
export const Toast = createComponent({
  react: React,
  tagName: "sc-base-toast",
  elementClass: ScToastBase,
  events: { onDismiss: "dismiss" },
});

/** <sc-base-chip>. */
export const Chip = createComponent({
  react: React,
  tagName: "sc-base-chip",
  elementClass: ScChipBase,
});

/** <sc-base-input>. `onInput` (live) / `onChange` (commit) native input events;
 *  read `e.target.value`. */
export const Input = createComponent({
  react: React,
  tagName: "sc-base-input",
  elementClass: ScInputBase,
  events: { onChange: "change", onInput: "input" },
});

/** <sc-base-inputnumber>. `onInput` (live) / `onChange` (commit/step) native
 *  input events; read `e.target.value`. */
export const InputNumber = createComponent({
  react: React,
  tagName: "sc-base-inputnumber",
  elementClass: ScInputNumberBase,
  events: { onChange: "change", onInput: "input" },
});

/** <sc-base-textarea>. `onInput` (live) / `onChange` (commit) native textarea
 *  events; read `e.target.value`. */
export const Textarea = createComponent({
  react: React,
  tagName: "sc-base-textarea",
  elementClass: ScTextareaBase,
  events: { onChange: "change", onInput: "input" },
});

/** <sc-base-text>. Pass text/inline content as children; style via
 *  size/weight/tone/font/align (+ truncate/inline). */
export const Text = createComponent({
  react: React,
  tagName: "sc-base-text",
  elementClass: ScTextBase,
});

/** <sc-base-popover>. Control via `open`; `onToggle` fires when it opens/closes
 *  (incl. native light-dismiss) — read `e.target.open`. Set `anchor` (an
 *  element) or place a trigger right before it. */
export const Popover = createComponent({
  react: React,
  tagName: "sc-base-popover",
  elementClass: ScPopoverBase,
  events: { onToggle: "toggle" },
});

/** <sc-base-modal>. Render only while visible with `open`; `dismissable` allows
 *  Esc/backdrop close. `onClose` fires on every dismissal — typically unmounts
 *  it. `label` is the dialog's accessible name. */
export const Modal = createComponent({
  react: React,
  tagName: "sc-base-modal",
  elementClass: ScModalBase,
  events: { onClose: "close" },
});

/** <sc-base-drawer>. Render always-mounted and toggle `open`; set `side`
 *  (right | left) and `dismissable`. `onClose` fires on every dismissal. A
 *  direct-child <header> is the title bar; `label` is the accessible name. */
export const Drawer = createComponent({
  react: React,
  tagName: "sc-base-drawer",
  elementClass: ScDrawerBase,
  events: { onClose: "close" },
});

/** <sc-base-alert>. Pass the message as children; set `variant`
 *  (info | success | warn | error). */
export const Alert = createComponent({
  react: React,
  tagName: "sc-base-alert",
  elementClass: ScAlertBase,
});

/** <sc-base-panel>. A direct-child <header> becomes the title bar; the rest is
 *  gap-stacked content. `disabled` mutes the card. */
export const Panel = createComponent({
  react: React,
  tagName: "sc-base-panel",
  elementClass: ScPanelBase,
});

/** <sc-base-empty>. Pass the placeholder message as children. */
export const Empty = createComponent({
  react: React,
  tagName: "sc-base-empty",
  elementClass: ScEmptyBase,
});

/** <sc-base-flex>. A wrapper-free flex layout primitive with orientation,
 *  wrap, alignment, justification, and tokenized gap controls. */
export const Flex = createComponent({
  react: React,
  tagName: "sc-base-flex",
  elementClass: ScFlexBase,
});

/** <sc-base-row>. A 24-unit grid row controlling gutter, wrapping, and axes. */
export const Row = createComponent({
  react: React,
  tagName: "sc-base-row",
  elementClass: ScRowBase,
});

/** <sc-base-col>. A row child with span/offset/order/push/pull/flex sizing. */
export const Col = createComponent({
  react: React,
  tagName: "sc-base-col",
  elementClass: ScColBase,
});

/** <sc-base-disclosure>. Put the summary in a `slot="summary"` child and the
 *  body in the default children; control `open` and read `onToggle`. */
export const Disclosure = createComponent({
  react: React,
  tagName: "sc-base-disclosure",
  elementClass: ScDisclosureBase,
  events: { onToggle: "toggle" },
});

/** <sc-base-progress>. A loading/progress indicator: `variant` (bar | spinner),
 *  `size` (sm | md | lg). Omit `value` for an indeterminate spinner/bar; set
 *  `value` (0…`max`) for a determinate one. `label` is the accessible name. */
export const Progress = createComponent({
  react: React,
  tagName: "sc-base-progress",
  elementClass: ScProgressBase,
});
