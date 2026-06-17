import * as React from "react";
import { createComponent } from "@lit/react";
import { ScEmptyBase } from "../lit/sc-empty";

/** React wrapper for <sc-empty-base>. Pass the placeholder message as children. */
export const ScEmpty = createComponent({
  react: React,
  tagName: "sc-empty-base",
  elementClass: ScEmptyBase,
});
