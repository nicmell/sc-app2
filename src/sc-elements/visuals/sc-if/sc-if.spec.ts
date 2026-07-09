import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

// Transparent container: full block content, contents unconditionally live —
// transparency is a runtime property, not encoded in the schema.
export const spec: ElementSpec = {
  tag: "sc-if",
  category: "visual",
  attrs: {
    bind: { type: "string", required: true },
  },
  content: { choice: ["blockContent"], mixed: true },
};
