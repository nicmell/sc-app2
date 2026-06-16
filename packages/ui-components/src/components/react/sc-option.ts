import * as React from "react";
import { createComponent } from "@lit/react";
import { ScOptionBase } from "../lit/sc-option";

/** React wrapper for <sc-option-base>. `onChange` → `change` CustomEvent;
 *  read `e.detail.value`. */
export const ScOption = createComponent({
  react: React,
  tagName: "sc-option-base",
  elementClass: ScOptionBase,
  events: { onChange: "change" },
});
