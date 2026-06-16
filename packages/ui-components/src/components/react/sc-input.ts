import * as React from "react";
import { createComponent } from "@lit/react";
import { ScInputBase } from "../lit/sc-input";

/** React wrapper for <sc-input-base>. `onChange` fires per edit; read the new
 *  text from `e.detail.value`. */
export const ScInput = createComponent({
  react: React,
  tagName: "sc-input-base",
  elementClass: ScInputBase,
  events: { onChange: "change" },
});
