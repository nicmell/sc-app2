import * as React from "react";
import { createComponent } from "@lit/react";
import { ScPanelBase } from "../lit/sc-panel";

/** React wrapper for <sc-panel-base>. A direct-child <header> becomes the title
 *  bar; the rest is gap-stacked content. `disabled` mutes the card. */
export const ScPanel = createComponent({
  react: React,
  tagName: "sc-panel-base",
  elementClass: ScPanelBase,
});
