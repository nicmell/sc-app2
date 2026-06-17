import * as React from "react";
import { createComponent } from "@lit/react";
import { ScInputNumberBase } from "../lit/sc-inputnumber";

/** React wrapper for <sc-inputnumber-base>. `onInput` (live) / `onChange`
 *  (commit/step) are the native input events; read `e.target.value`. */
export const ScInputNumber = createComponent({
  react: React,
  tagName: "sc-inputnumber-base",
  elementClass: ScInputNumberBase,
  events: { onChange: "change", onInput: "input" },
});
