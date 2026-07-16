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
    label: "Button",
    icon: "cursor-click",
    template: element("sc-button", { value: "0" }),
  },
  "sc-checkbox": {
    label: "Checkbox",
    icon: "check-square",
    template: element("sc-checkbox", { value: "0" }),
  },
  "sc-envelope": {
    label: "Envelope",
    icon: "chart-line",
    template: element("sc-envelope", { value: "0" }),
  },
  "sc-knob": { label: "Knob", icon: "dial", template: element("sc-knob", { value: "0" }) },
  "sc-radio-group": {
    label: "Radio Group",
    icon: "radio-button",
    template: element("sc-radio-group", { value: "0" }),
  },
  "sc-select": { label: "Select", icon: "list", template: element("sc-select", { value: "0" }) },
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
