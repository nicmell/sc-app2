import * as React from "react";
import { createComponent } from "@lit/react";
import { ScInputBase } from "../lit/sc-input";

/** React wrapper for <sc-input-base>. `onInput` (live) / `onChange` (commit)
 *  are the native input events; read `e.target.value`. */
export const ScInput = createComponent({
  react: React,
  tagName: "sc-input-base",
  elementClass: ScInputBase,
  events: { onChange: "change", onInput: "input" },
});
