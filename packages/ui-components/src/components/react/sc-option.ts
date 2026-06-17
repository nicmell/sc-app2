import * as React from "react";
import { createComponent } from "@lit/react";
import { ScOptionBase } from "../lit/sc-option";

/** React wrapper for <sc-option-base>. An option reports selection to its
 *  <ScSelect> through context (no own event) — listen for `change` on the
 *  select. Use as a child: <ScSelect><ScOption value={0} label="…" /></ScSelect>. */
export const ScOption = createComponent({
  react: React,
  tagName: "sc-option-base",
  elementClass: ScOptionBase,
});
