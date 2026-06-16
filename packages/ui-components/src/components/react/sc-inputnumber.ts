import * as React from "react";
import { createComponent } from "@lit/react";
import { ScInputNumberBase } from "../lit/sc-inputnumber";

/** React wrapper for <sc-inputnumber-base>. `onChange` fires per edit/step;
 *  read the new number from `e.detail.value`. */
export const ScInputNumber = createComponent({
  react: React,
  tagName: "sc-inputnumber-base",
  elementClass: ScInputNumberBase,
  events: { onChange: "change" },
});
