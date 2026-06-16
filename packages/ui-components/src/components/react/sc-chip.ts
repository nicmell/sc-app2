import * as React from "react";
import { createComponent } from "@lit/react";
import { ScChipBase } from "../lit/sc-chip";

/** React wrapper for <sc-chip-base>. */
export const ScChip = createComponent({
  react: React,
  tagName: "sc-chip-base",
  elementClass: ScChipBase,
});
