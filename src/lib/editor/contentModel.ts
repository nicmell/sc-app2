/** Spec-derived child placement and text-content rules for editor operations. */

import { BLOCK_CONTENT, BLOCK_GROUPS } from "@/sc-elements/internal/xsd/groups";
import { SPECS } from "@/sc-elements/internal/xsd/registry";

export const HTML_BLOCK_TAGS: ReadonlySet<string> = new Set([
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
]);

export const HTML_INLINE_TAGS: ReadonlySet<string> = new Set(["span", "strong", "em", "br"]);

const categoryGroups = new Map(
  BLOCK_GROUPS.map(({ category, group }) => [
    group,
    [...SPECS.values()].filter((spec) => spec.category === category).map((spec) => spec.tag),
  ]),
);
const cache = new Map<string, ReadonlySet<string>>();

function expand(ref: string): readonly string[] {
  if (ref === "htmlElements") return [...HTML_BLOCK_TAGS];
  if (ref === "inlineContent") {
    return [...HTML_INLINE_TAGS, "sc-display", "sc-if", "sc-text"];
  }
  if (ref === BLOCK_CONTENT) {
    return [
      ...HTML_BLOCK_TAGS,
      ...BLOCK_GROUPS.flatMap(({ group }) => categoryGroups.get(group) ?? []),
    ];
  }
  return categoryGroups.get(ref) ?? [ref];
}

export function allowedChildren(tag: string): ReadonlySet<string> {
  const prior = cache.get(tag);
  if (prior) return prior;
  let refs: readonly string[];
  if (tag === "ul" || tag === "ol") refs = ["li"];
  else if (HTML_BLOCK_TAGS.has(tag)) {
    refs =
      HTML_INLINE_TAGS.has(tag) || /^h[1-6]$/.test(tag) || tag === "p"
        ? ["inlineContent"]
        : tag === "hr" || tag === "br"
          ? []
          : [BLOCK_CONTENT];
  } else refs = SPECS.get(tag)?.content?.choice ?? [];
  const result = new Set(refs.flatMap(expand));
  cache.set(tag, result);
  return result;
}

export function canContain(parentTag: string, childTag: string): boolean {
  return allowedChildren(parentTag).has(childTag);
}

export function acceptsText(tag: string): boolean {
  if (tag === "ul" || tag === "ol" || tag === "hr" || tag === "br") return false;
  if (HTML_BLOCK_TAGS.has(tag)) return true;
  return SPECS.get(tag)?.content?.mixed === true;
}
