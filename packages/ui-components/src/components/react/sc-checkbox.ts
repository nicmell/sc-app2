import * as React from "react";
import { createComponent } from "@lit/react";
import { ScCheckboxBase } from "../lit/sc-checkbox";

/** React wrapper for <sc-checkbox-base>. `onChange` receives the `change`
 *  CustomEvent; read the new value from `e.detail.value` (0|1). */
export const ScCheckbox = createComponent({
  react: React,
  tagName: "sc-checkbox-base",
  elementClass: ScCheckboxBase,
  events: { onChange: "change" },
});
