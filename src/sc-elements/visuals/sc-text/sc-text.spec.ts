import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

export const spec: ElementSpec = {
  tag: "sc-text",
  category: "visual",
  attrs: {
    as: {
      type: "enum",
      values: ["span", "p", "div", "label", "h1", "h2", "h3", "h4", "h5", "h6"],
    },
    size: { type: "enum", values: ["xs", "sm", "md", "lg", "xl"] },
    weight: { type: "enum", values: ["regular", "medium", "bold"] },
    tone: {
      type: "enum",
      values: ["default", "dim", "mute", "faint", "primary", "ok", "warn", "error", "info"],
    },
    font: { type: "enum", values: ["sans", "mono"] },
    align: { type: "enum", values: ["start", "center", "end"] },
    transform: { type: "enum", values: ["none", "uppercase", "lowercase", "capitalize"] },
    truncate: { type: "boolean" },
    inline: { type: "boolean" },
  },
  content: { choice: ["inlineContent"], mixed: true },
};
