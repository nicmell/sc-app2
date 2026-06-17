import * as React from "react";
import { createComponent } from "@lit/react";
import { ScPopoverBase } from "../lit/sc-popover";

/** React wrapper for <sc-popover-base>. Control via `open`; `onToggle` fires
 *  when it opens/closes (incl. native light-dismiss) — read `e.target.open`.
 *  Set `anchor` (an element) or place a trigger right before it. */
export const ScPopover = createComponent({
  react: React,
  tagName: "sc-popover-base",
  elementClass: ScPopoverBase,
  events: { onToggle: "toggle" },
});
