import * as React from "react";
import { createComponent } from "@lit/react";
import { ScRadioGroupBase } from "../lit/sc-radio-group";

/** React wrapper for <sc-radio-group-base>. Pass <ScRadio> children; selection
 *  + size/variant/disabled flow to them via context. `onChange` is the group's
 *  change; read the selected value from `e.target.value`. */
export const ScRadioGroup = createComponent({
  react: React,
  tagName: "sc-radio-group-base",
  elementClass: ScRadioGroupBase,
  events: { onChange: "change" },
});
