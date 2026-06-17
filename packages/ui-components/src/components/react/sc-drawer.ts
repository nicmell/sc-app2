import * as React from "react";
import { createComponent } from "@lit/react";
import { ScDrawerBase } from "../lit/sc-drawer";

/** React wrapper for <sc-drawer-base>. Render it always-mounted and toggle
 *  `open`; set `side` (right | left) and `dismissable` for Esc/backdrop close.
 *  `onClose` fires on every dismissal. A direct-child <header> is the title bar. */
export const ScDrawer = createComponent({
  react: React,
  tagName: "sc-drawer-base",
  elementClass: ScDrawerBase,
  events: { onClose: "close" },
});
