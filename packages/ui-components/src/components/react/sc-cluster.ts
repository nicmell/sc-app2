import * as React from "react";
import { createComponent } from "@lit/react";
import { ScClusterBase } from "../lit/sc-cluster";

/** React wrapper for <sc-cluster-base>. Pass items as children; `gap` (sm | md |
 *  lg) selects spacing (unset = base). */
export const ScCluster = createComponent({
  react: React,
  tagName: "sc-cluster-base",
  elementClass: ScClusterBase,
});
