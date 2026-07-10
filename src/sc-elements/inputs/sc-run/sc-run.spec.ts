import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

// Bindless sc-run targets the parent node; `bind` names a synth/group otherwise.
export const spec: ElementSpec = {
  tag: "sc-run",
  category: "input",
  attrs: {
    bind: { type: "string", runtime: false },
  },
};
