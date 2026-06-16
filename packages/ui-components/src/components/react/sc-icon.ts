import * as React from "react";
import { createComponent } from "@lit/react";
import { ScIconBase } from "../lit/sc-icon";

/** React wrapper for <sc-icon-base>. Pass a Phosphor icon `name` (fill weight);
 *  the host must load `@phosphor-icons/web/fill` once for the glyphs to show. */
export const ScIcon = createComponent({
  react: React,
  tagName: "sc-icon-base",
  elementClass: ScIconBase,
});
