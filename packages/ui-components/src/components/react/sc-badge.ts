import * as React from "react";
import { createComponent } from "@lit/react";
import { ScBadgeBase } from "../lit/sc-badge";

/** React wrapper for <sc-badge-base>. */
export const ScBadge = createComponent({
  react: React,
  tagName: "sc-badge-base",
  elementClass: ScBadgeBase,
});
