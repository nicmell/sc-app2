import * as React from "react";
import { createComponent } from "@lit/react";
import { ScTextBase } from "../lit/sc-text";

/** React wrapper for <sc-text-base>. Pass text/inline content as children;
 *  style via size/weight/tone/font/align (+ truncate/inline). */
export const ScText = createComponent({
  react: React,
  tagName: "sc-text-base",
  elementClass: ScTextBase,
});
