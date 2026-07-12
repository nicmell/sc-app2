import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

// The draggable-breakpoint envelope editor: binds a STATE <sc-env> via
// bind:value (a plain writable path — write-capable like sc-button, so the
// static `value` form is meaningless and rejected at runtime).
export const spec: ElementSpec = {
  tag: "sc-env-editor",
  category: "input",
  attrs: {
    value: { type: "scalar", required: true },
  },
};
