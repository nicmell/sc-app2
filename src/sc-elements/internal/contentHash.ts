// Deterministic parsed-element identity: every id is `hash@ordinal` (the root
// is `@0`; split on the LAST `@`). The hash covers the tag, present spec attrs
// and runtime `bind:` forms, own trimmed text, and ordered sc-* child hashes.
// COMMON_ATTRS, xmlns declarations, unknown attrs, and tree location are
// deliberately excluded. Attribute-value formatting is significant: notably,
// sc-strudel's `\n` escape is hashed raw. Ordinals make equal subtrees unique
// within a parse; insertions shift later ordinals, so consumers match the hash
// first and use the ordinal as a tiebreaker. Two mounts of one plugin may have
// duplicate DOM ids — accepted, because nothing queries elements by id.

import { isNodeType } from "@/lib/utils/guards";
import { SPECS } from "@/sc-elements/internal/xsd/registry";
import { bindAttr, COMMON_ATTRS } from "@/sc-elements/internal/xsd/types";

function cyrb53(value: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function ownText(el: Element): string {
  const chunks: string[] = [];
  const visit = (node: Node): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const value = child.textContent?.trim();
        if (value) chunks.push(value);
      } else if (child instanceof Element && !isNodeType(child.tagName.toLowerCase())) {
        visit(child);
      }
    }
  };
  visit(el);
  return chunks.join(" ");
}

function scChildren(el: Element): Element[] {
  const children: Element[] = [];
  const visit = (parent: Element): void => {
    for (const child of Array.from(parent.children)) {
      if (isNodeType(child.tagName.toLowerCase())) children.push(child);
      else visit(child);
    }
  };
  visit(el);
  return children;
}

/** Hash an sc-* element's canonical authored-content serialization. */
export function contentHash(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const attrs: Array<[string, string]> = [];
  for (const [name, spec] of Object.entries(SPECS.get(tag)?.attrs ?? {})) {
    if (COMMON_ATTRS.has(name)) continue;
    const value = el.getAttribute(name);
    if (value !== null) attrs.push([name, value]);
    if (spec.runtime !== false) {
      const qualified = bindAttr(name);
      const expression = el.getAttribute(qualified);
      if (expression !== null) attrs.push([qualified, expression]);
    }
  }
  attrs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const serializedAttrs = attrs.map(([name, value]) => `${name}=${JSON.stringify(value)}`).join(",");
  const childHashes = scChildren(el).map(contentHash).join(",");
  return cyrb53(`${tag}(${serializedAttrs}){${ownText(el)}}[${childHashes}]`);
}
