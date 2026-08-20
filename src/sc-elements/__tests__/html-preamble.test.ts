// Drift guard: the fixed HTML tables must match the hand-authored declarations
// and groups in preamble.xml. Keep the extraction scoped to the relevant XML
// sections so generated sc-* declarations cannot affect the assertions.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  HTML_ELEMENTS,
  HTML_ELEMENTS_GROUP,
  INLINE_CONTENT,
  type HtmlContentKind,
} from "@/sc-elements/internal/xsd/html";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const PREAMBLE = resolve(REPO, "src/sc-elements/internal/xsd/preamble.xml");
const SOURCE = readFileSync(PREAMBLE, "utf8");

function sectionBetween(source: string, start: string, end: string): string {
  const startAt = source.indexOf(start);
  const endAt = source.indexOf(end, startAt + start.length);
  if (startAt < 0 || endAt < 0) throw new Error(`missing preamble markers: ${start} / ${end}`);
  return source.slice(startAt, endAt);
}

function kindForType(type: string | undefined): HtmlContentKind {
  switch (type) {
    case undefined:
      return "empty";
    case "blockType":
      return "block";
    case "inlineType":
      return "inline";
    case "listType":
      return "list";
    default:
      throw new Error(`unexpected HTML declaration type "${type}"`);
  }
}

function declaredElements(): Array<{ tag: string; kind: HtmlContentKind }> {
  const declarations = sectionBetween(
    SOURCE,
    "<!-- ==================== Element declarations ==================== -->",
    "<!-- sc-* elements -->",
  );
  return [...declarations.matchAll(/<xs:element name="([^"]+)"(?: type="([^"]+)")?\/>/g)].map(
    ([, tag, type]) => ({ tag, kind: kindForType(type) }),
  );
}

function groupRefs(name: string): string[] {
  const group = SOURCE.match(new RegExp(`<xs:group name="${name}">([\\s\\S]*?)</xs:group>`));
  if (group === null) throw new Error(`missing preamble group "${name}"`);
  return [...group[1].matchAll(/<xs:element ref="([^"]+)"\/>/g)].map(([, tag]) => tag);
}

describe("HTML preamble tables", () => {
  it("matches the fixed element declarations in declaration order", () => {
    expect(declaredElements()).toEqual(HTML_ELEMENTS);
  });

  it("matches the htmlElements group in group order", () => {
    expect(groupRefs("htmlElements")).toEqual(HTML_ELEMENTS_GROUP);
  });

  it("matches the inlineContent group in group order", () => {
    expect(groupRefs("inlineContent")).toEqual(INLINE_CONTENT);
  });
});
