import * as React from "react";
import { createComponent } from "@lit/react";
import { ScButtonBase } from "../lit/sc-button";

/** React wrapper for <sc-button-base>. Use standard React `onClick` — the
 *  native click bubbles from the inner button. Pass Phosphor icon names via
 *  `icon` / `trailingIcon`, and `iconOnly` for an icon button (set `label`
 *  as the accessible name). */
export const ScButton = createComponent({
  react: React,
  tagName: "sc-button-base",
  elementClass: ScButtonBase,
});
