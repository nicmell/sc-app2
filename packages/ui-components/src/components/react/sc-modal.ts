import * as React from "react";
import { createComponent } from "@lit/react";
import { ScModalBase } from "../lit/sc-modal";

/** React wrapper for <sc-modal-base>. Render it only while visible with
 *  `open`; set `dismissable` to allow Esc/backdrop close. `onClose` fires on
 *  every dismissal (Esc, backdrop, programmatic) — typically unmounts it. */
export const ScModal = createComponent({
  react: React,
  tagName: "sc-modal-base",
  elementClass: ScModalBase,
  events: { onClose: "close" },
});
