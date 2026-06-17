import * as React from "react";
import { createComponent } from "@lit/react";
import { ScStackBase } from "../lit/sc-stack";

/** React wrapper for <sc-stack-base>. Pass items as children; `gap` (sm | md |
 *  lg) selects spacing (unset = base). */
export const ScStack = createComponent({
  react: React,
  tagName: "sc-stack-base",
  elementClass: ScStackBase,
});
