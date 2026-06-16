import * as React from "react";
import { createComponent } from "@lit/react";
import { ScRadioGroupBase } from "../lit/sc-radio-group";

/** React wrapper for <sc-radio-group-base>. Pass <ScRadio> children; the group
 *  syncs their checked/size/variant/disabled. `onChange` → group `change`
 *  CustomEvent; read the selected value from `e.detail.value`. */
export const ScRadioGroup = createComponent({
  react: React,
  tagName: "sc-radio-group-base",
  elementClass: ScRadioGroupBase,
  events: { onChange: "change" },
});
