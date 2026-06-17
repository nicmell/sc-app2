import * as React from "react";
import { createComponent } from "@lit/react";
import { ScCheckboxBase } from "../lit/sc-checkbox";

/** React wrapper for <sc-checkbox-base>. `onChange` is the native change; read
 *  `e.target.checked`. */
export const ScCheckbox = createComponent({
  react: React,
  tagName: "sc-checkbox-base",
  elementClass: ScCheckboxBase,
  events: { onChange: "change" },
});
