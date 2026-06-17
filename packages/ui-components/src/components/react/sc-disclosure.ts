import * as React from "react";
import { createComponent } from "@lit/react";
import { ScDisclosureBase } from "../lit/sc-disclosure";

/** React wrapper for <sc-disclosure-base>. Put the summary in a
 *  `slot="summary"` child and the body in the default children; control `open`
 *  and read `onToggle` (fires on user toggle — read `e.target.open`). */
export const ScDisclosure = createComponent({
  react: React,
  tagName: "sc-disclosure-base",
  elementClass: ScDisclosureBase,
  events: { onToggle: "toggle" },
});
