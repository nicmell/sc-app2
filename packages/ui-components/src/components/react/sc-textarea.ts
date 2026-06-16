import * as React from "react";
import { createComponent } from "@lit/react";
import { ScTextareaBase } from "../lit/sc-textarea";

/** React wrapper for <sc-textarea-base>. `onChange` fires per edit; read the
 *  new text from `e.detail.value`. */
export const ScTextarea = createComponent({
  react: React,
  tagName: "sc-textarea-base",
  elementClass: ScTextareaBase,
  events: { onChange: "change" },
});
