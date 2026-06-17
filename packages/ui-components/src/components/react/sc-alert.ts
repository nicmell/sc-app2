import * as React from "react";
import { createComponent } from "@lit/react";
import { ScAlertBase } from "../lit/sc-alert";

/** React wrapper for <sc-alert-base>. Pass the message as children; set
 *  `variant` (info | success | warn | error). */
export const ScAlert = createComponent({
  react: React,
  tagName: "sc-alert-base",
  elementClass: ScAlertBase,
});
