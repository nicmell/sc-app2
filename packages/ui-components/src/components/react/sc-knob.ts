import * as React from "react";
import { createComponent } from "@lit/react";
import { ScKnobBase } from "../lit/sc-knob";

/** React wrapper for <sc-knob-base>. `onInput` (live) / `onChange` (commit) are
 *  the native range events; read `e.target.value`. */
export const ScKnob = createComponent({
  react: React,
  tagName: "sc-knob-base",
  elementClass: ScKnobBase,
  events: { onChange: "change", onInput: "input" },
});
