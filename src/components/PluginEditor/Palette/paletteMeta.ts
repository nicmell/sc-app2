import { createElement, type ElementNode } from "@/lib/editor/model";

export interface PaletteMeta {
  label: string;
  icon: string;
  template: () => ElementNode;
}

const element =
  (tag: string, attrs: Readonly<Record<string, string>> = {}): (() => ElementNode) =>
  () =>
    createElement(tag, attrs);

export const PALETTE_META: Readonly<Record<string, PaletteMeta>> = {
  "sc-group": { label: "Group", icon: "stack", template: element("sc-group", { name: "group" }) },
  "sc-synth": {
    label: "Synth",
    icon: "wave-sine",
    template: element("sc-synth", { name: "synth", synthdef: "default" }),
  },
  "sc-synthdef": {
    label: "Synth Definition",
    icon: "waveform",
    template: element("sc-synthdef", { name: "default" }),
  },
  "sc-ugen": {
    label: "UGen",
    icon: "function",
    template: element("sc-ugen", { name: "signal", type: "SinOsc" }),
  },
  "sc-control": {
    label: "Control",
    icon: "sliders-horizontal",
    template: element("sc-control", { name: "control" }),
  },
  "sc-var": { label: "Variable", icon: "code", template: element("sc-var", { name: "variable" }) },
  "sc-button": {
    // Buttons are write-only: the static `value` form is rejected at runtime,
    // so the template ships a bind placeholder (a pointed parse error until
    // the author points it at a real control/var — the honest default).
    label: "Button",
    icon: "cursor-click",
    template: element("sc-button", { "bind:value": "gate", label: "Button" }),
  },
  "sc-checkbox": {
    label: "Checkbox",
    icon: "check-square",
    template: element("sc-checkbox", { value: "0" }),
  },
  "sc-envelope": {
    // Write-capable like sc-button: static `value` is rejected at runtime.
    label: "Envelope",
    icon: "chart-line",
    template: element("sc-envelope", { "bind:value": "env" }),
  },
  "sc-knob": { label: "Knob", icon: "dial", template: element("sc-knob", { value: "0" }) },
  "sc-option": {
    label: "Option",
    icon: "list-plus",
    template: element("sc-option", { value: "0", label: "Option" }),
  },
  "sc-radio": {
    label: "Radio",
    icon: "radio-button",
    template: element("sc-radio", { value: "0", label: "Radio" }),
  },
  "sc-radio-group": {
    label: "Radio Group",
    icon: "radio-button",
    template: () =>
      createElement("sc-radio-group", { value: "0" }, [
        createElement("sc-radio", { value: "0", label: "Off" }),
        createElement("sc-radio", { value: "1", label: "On" }),
      ]),
  },
  "sc-select": {
    label: "Select",
    icon: "list",
    template: () =>
      createElement("sc-select", { value: "0" }, [
        createElement("sc-option", { value: "0", label: "Off" }),
        createElement("sc-option", { value: "1", label: "On" }),
      ]),
  },
  "sc-slider": { label: "Slider", icon: "sliders", template: element("sc-slider", { value: "0" }) },
  "sc-switch": {
    label: "Switch",
    icon: "toggle-left",
    template: element("sc-switch", { value: "0" }),
  },
  "sc-col": { label: "Column", icon: "columns", template: element("sc-col") },
  "sc-display": {
    label: "Display",
    icon: "monitor",
    template: element("sc-display", { value: "0" }),
  },
  "sc-flex": { label: "Flex", icon: "arrows-out-line-horizontal", template: element("sc-flex") },
  "sc-if": { label: "Conditional", icon: "git-branch", template: element("sc-if", { when: "1" }) },
  "sc-row": {
    label: "Row",
    icon: "rows",
    template: () => createElement("sc-row", {}, [createElement("sc-col")]),
  },
  "sc-text": { label: "Text", icon: "text-t", template: element("sc-text") },
  "sc-console": { label: "Console", icon: "terminal-window", template: element("sc-console") },
  "sc-keyboard": {
    label: "Keyboard",
    icon: "piano-keys",
    template: element("sc-keyboard", { synthdef: "default" }),
  },
  "sc-scope": { label: "Scope", icon: "chart-line-up", template: element("sc-scope") },
  "sc-strudel": { label: "Strudel", icon: "music-notes", template: element("sc-strudel") },
  div: { label: "Division", icon: "rectangle", template: element("div") },
  p: { label: "Paragraph", icon: "paragraph", template: element("p") },
  span: { label: "Span", icon: "text-aa", template: element("span") },
  h1: { label: "Heading 1", icon: "text-h-one", template: element("h1") },
  h2: { label: "Heading 2", icon: "text-h-two", template: element("h2") },
  h3: { label: "Heading 3", icon: "text-h-three", template: element("h3") },
  label: { label: "Label", icon: "tag", template: element("label") },
};

export const HTML_PALETTE_TAGS = ["div", "p", "span", "h1", "h2", "h3", "label"] as const;
