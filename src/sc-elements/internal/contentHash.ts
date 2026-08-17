// Deterministic parsed-element identity: every id is a bare cyrb53 hex,
// chained from its parent's id so ids are tree-unique and deterministic across
// mounts. It covers ONLY parent id, tag, sibling index, and present spec attrs
// plus `bind:` forms. COMMON_ATTRS ({id,class,title,style}), xmlns, unknown
// attrs, text content, and children are excluded; editing a child never
// changes its parent's id. Inserting a sibling shifts later siblings and their
// whole subtrees (ids encode ancestry). Attribute-value formatting stays
// significant (sc-strudel's `\n` escape hashes raw); two mounts of one plugin
// repeat ids — accepted; nothing queries by id.

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

/** Hash an sc-* element's path-chained identity: the parent's id, the tag,
 *  the sibling index within the hydration scope, and the present spec attrs. */
export function contentHash(el: Element, parentId: string, index: number): string {
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
  return cyrb53(`${parentId}/${tag}[${index}](${serializedAttrs})`);
}
