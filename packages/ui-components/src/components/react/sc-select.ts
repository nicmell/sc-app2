import * as React from "react";
import { createComponent } from "@lit/react";
import { ScSelectBase } from "../lit/sc-select";

/** React wrapper for <sc-select-base>. Pass <ScOption> children (declarative).
 *  `onChange` is the select's change; read `e.target.value`. */
export const ScSelect = createComponent({
  react: React,
  tagName: "sc-select-base",
  elementClass: ScSelectBase,
  events: { onChange: "change" },
});
