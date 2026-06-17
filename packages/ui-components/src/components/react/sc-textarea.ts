import * as React from "react";
import { createComponent } from "@lit/react";
import { ScTextareaBase } from "../lit/sc-textarea";

/** React wrapper for <sc-textarea-base>. `onInput` (live) / `onChange` (commit)
 *  are the native textarea events; read `e.target.value`. */
export const ScTextarea = createComponent({
  react: React,
  tagName: "sc-textarea-base",
  elementClass: ScTextareaBase,
  events: { onChange: "change", onInput: "input" },
});
