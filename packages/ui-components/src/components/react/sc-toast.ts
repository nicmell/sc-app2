import * as React from "react";
import { createComponent } from "@lit/react";
import { ScToastBase } from "../lit/sc-toast";

/** React wrapper for <sc-toast-base>. `onDismiss` fires when the close button
 *  is clicked; the owner removes the toast from its list. */
export const ScToast = createComponent({
  react: React,
  tagName: "sc-toast-base",
  elementClass: ScToastBase,
  events: { onDismiss: "dismiss" },
});
