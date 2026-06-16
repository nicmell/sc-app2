import * as React from "react";
import { createComponent } from "@lit/react";
import { ScRadioBase } from "../lit/sc-radio";

/** React wrapper for <sc-radio-base>. `onChange` → `change` CustomEvent;
 *  read `e.detail.value`. */
export const ScRadio = createComponent({
  react: React,
  tagName: "sc-radio-base",
  elementClass: ScRadioBase,
  events: { onChange: "change" },
});
