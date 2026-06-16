import * as React from "react";
import { createComponent } from "@lit/react";
import { ScSliderBase } from "../lit/sc-slider";

/** React wrapper for <sc-slider-base>. `onInput` (live) / `onChange` (commit)
 *  are the native range events; read `e.target.value`. */
export const ScSlider = createComponent({
  react: React,
  tagName: "sc-slider-base",
  elementClass: ScSliderBase,
  events: { onChange: "change", onInput: "input" },
});
