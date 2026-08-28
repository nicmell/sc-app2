// Deterministic parsed-element identity: every id is a bare cyrb53 hex over
// `pluginId:parentPath/tag[index](attrs)` — the plugin id (empty when
// unseeded, e.g. unit tests), the enclosing level's named path,
// the tag, the sibling index within the level scope, and the present spec
// attrs plus `bind:` forms. Uniqueness within a mount holds because every
// non-root level opener REQUIRES a `name` (spec-enforced) and names are
// duplicate-checked per scope — the only nameless level owner is the root,
// whose path is empty. A FUTURE nameless ScParent category would break this;
// hash-ids.test pins the invariant. Seeding by plugin id binds ids to the
// exact installed source (a re-upload mints a fresh plugin uuid), so stale
// persisted state fails closed; box identity deliberately stays OUT of the
// hash — per-box nesting discriminates instances, keeping value maps
// portable between mounts of the same plugin. COMMON_ATTRS
// ({id,class,title,style}), xmlns, unknown attrs, text content, children,
// and ancestor attr content are excluded; editing an ancestor's attrs never
// changes a descendant's id (only renames do, via the path). Inserting a
// sibling shifts later siblings. Attribute-value formatting stays
// significant (sc-strudel's `\n` escape hashes raw); two mounts of one
// plugin repeat ids — accepted; nothing queries by id.

import { bindAttr, COMMON_ATTRS, getSpec } from "@/sc-elements/internal/spec";

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

/** Hash an sc-* element's identity: the plugin id, the enclosing level's
 *  named path, the tag, the sibling index within the level scope, and the
 *  present spec attrs. */
export function contentHash(
  el: Element,
  parentPath: string,
  index: number,
  pluginId: string,
): string {
  const tag = el.tagName.toLowerCase();
  const attrs: Array<[string, string]> = [];
  for (const [name, spec] of Object.entries(getSpec(tag)?.attrs ?? {})) {
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
  const serializedAttrs = attrs
    .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
    .join(",");
  return cyrb53(`${pluginId}:${parentPath}/${tag}[${index}](${serializedAttrs})`);
}
