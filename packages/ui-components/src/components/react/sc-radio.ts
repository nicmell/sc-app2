import * as React from "react";
import { createComponent } from "@lit/react";
import { ScRadioBase } from "../lit/sc-radio";

/** React wrapper for <sc-radio-base>. Use inside <ScRadioGroup> and listen for
 *  `change` on the group; a radio reports selection through context. */
export const ScRadio = createComponent({
  react: React,
  tagName: "sc-radio-base",
  elementClass: ScRadioBase,
});
