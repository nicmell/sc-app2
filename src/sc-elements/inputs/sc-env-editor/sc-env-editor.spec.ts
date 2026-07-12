import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

// The draggable-breakpoint envelope editor: binds a STATE <sc-env> via
// bind:value (a plain writable path — write-capable like sc-button, so the
// static `value` form is meaningless and rejected at runtime).
export const spec: ElementSpec = {
  tag: "sc-env-editor",
  category: "input",
  attrs: {
    value: { type: "scalar", required: true },
    // Breakpoint-COUNT bounds (the start point included): double-click
    // insert is blocked at `maxbreakpoints`, removal at `minbreakpoints` —
    // set both equal to LOCK the structure (positions stay draggable), so
    // slot lenses (`bind:value="env.5"` knobs) keep stable meanings.
    minbreakpoints: { type: "integer", runtime: false },
    maxbreakpoints: { type: "integer", runtime: false },
  },
};
