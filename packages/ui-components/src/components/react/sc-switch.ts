import * as React from "react";
import { createComponent } from "@lit/react";
import { ScSwitchBase } from "../lit/sc-switch";

/** React wrapper for <sc-switch-base>. `onChange` → `change` CustomEvent;
 *  read `e.detail.value` (0|1). */
export const ScSwitch = createComponent({
  react: React,
  tagName: "sc-switch-base",
  elementClass: ScSwitchBase,
  events: { onChange: "change" },
});
