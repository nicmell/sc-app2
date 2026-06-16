import * as React from "react";
import { createComponent } from "@lit/react";
import { ScSliderBase } from "../lit/sc-slider";

/** React wrapper for <sc-slider-base>. `onChange` → `change` CustomEvent;
 *  read `e.detail.value`. */
export const ScSlider = createComponent({
  react: React,
  tagName: "sc-slider-base",
  elementClass: ScSliderBase,
  events: { onChange: "change" },
});
