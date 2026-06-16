import * as React from "react";
import { createComponent } from "@lit/react";
import { ScSelectBase } from "../lit/sc-select";

/** React wrapper for <sc-select-base>. Pass `options` ({value,label}[]) as a
 *  prop. `onChange` → `change` CustomEvent; read `e.detail.value`. */
export const ScSelect = createComponent({
  react: React,
  tagName: "sc-select-base",
  elementClass: ScSelectBase,
  events: { onChange: "change" },
});
