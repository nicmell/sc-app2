// The fixed HTML vocabulary from the hand-authored XSD preamble. The specs
// generator consumes this table alongside the authored sc-* specs so the Rust
// validator receives the complete content model without parsing XML.

export type HtmlContentKind = "block" | "inline" | "list" | "empty";

/** The preamble's fixed HTML elements, in DECLARATION order (preamble.xml
 * "Element declarations" section). kind maps the XSD type: blockType → block,
 * inlineType → inline, listType → list, no type attribute (hr/br) → empty. */
export const HTML_ELEMENTS: ReadonlyArray<{ tag: string; kind: HtmlContentKind }> = [
  { tag: "div", kind: "block" },
  { tag: "p", kind: "inline" },
  { tag: "label", kind: "block" },
  { tag: "span", kind: "inline" },
  { tag: "strong", kind: "inline" },
  { tag: "em", kind: "inline" },
  { tag: "h1", kind: "inline" },
  { tag: "h2", kind: "inline" },
  { tag: "h3", kind: "inline" },
  { tag: "h4", kind: "inline" },
  { tag: "h5", kind: "inline" },
  { tag: "h6", kind: "inline" },
  { tag: "ul", kind: "list" },
  { tag: "ol", kind: "list" },
  { tag: "li", kind: "block" },
  { tag: "hr", kind: "empty" },
  { tag: "br", kind: "empty" },
];

/** The preamble's `htmlElements` xs:group members, in GROUP order (li is
 * child-only — reached through listType, never the group). */
export const HTML_ELEMENTS_GROUP: readonly string[] = [
  "div",
  "p",
  "label",
  "ul",
  "ol",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "span",
  "strong",
  "em",
  "hr",
  "br",
];

/** The preamble's `inlineContent` xs:group members, in GROUP order. */
export const INLINE_CONTENT: readonly string[] = [
  "span",
  "strong",
  "em",
  "br",
  "sc-display",
  "sc-if",
  "sc-text",
];
