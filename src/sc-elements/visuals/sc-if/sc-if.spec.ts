import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

// Transparent container: full block content, contents unconditionally live —
// transparency is a runtime property, not encoded in the schema.
export const spec: ElementSpec = {
  tag: "sc-if",
  category: "visual",
  attrs: {
    // scalar (NOT string): an evaluated 0 must stay falsy for the truthiness.
    when: { type: "scalar", required: true },
  },
  content: { choice: ["blockContent"], mixed: true },
};
