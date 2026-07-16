import { describe, expect, it } from "vitest";
import { parseEntry } from "../parse";
import { serializeEntry } from "../serialize";
import type { EditorNode } from "../model";

const ENTRIES = import.meta.glob<string>("/examples/**/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

function stripKeys(node: EditorNode): unknown {
  if (node.kind === "text") return { kind: node.kind, text: node.text };
  return {
    kind: node.kind,
    tag: node.tag,
    attrs: node.attrs,
    children: node.children.map(stripKeys),
  };
}

function textContent(node: EditorNode): string[] {
  if (node.kind === "text") return [node.text];
  return node.children.flatMap(textContent);
}

describe("entry serialization", () => {
  it("escapes values and formats pure element trees", () => {
    const doc = parseEntry(
      '<sc-plugin xmlns="http://www.w3.org/1999/xhtml"><div title="a &amp; &quot;b&quot;"><span/></div></sc-plugin>',
    );
    expect(serializeEntry(doc)).toContain(
      '<div title="a &amp; &quot;b&quot;">\n    <span/>\n  </div>',
    );
  });

  it("preserves mixed text exactly through serialization", () => {
    const xml =
      '<sc-plugin xmlns="http://www.w3.org/1999/xhtml"><sc-strudel>  a &lt; b\n c &gt; d  </sc-strudel></sc-plugin>';
    const before = parseEntry(xml);
    const after = parseEntry(serializeEntry(before));
    expect(textContent(after)).toEqual(textContent(before));
  });

  for (const [path, xml] of Object.entries(ENTRIES)) {
    if (!/(?:index|entry)\.html$/.test(path)) continue;
    const parsed = new DOMParser().parseFromString(xml, "text/xml");
    if (parsed.getElementsByTagName("parsererror").length > 0) continue;
    if (parsed.documentElement.localName !== "sc-plugin") continue;
    it(`roundtrips ${path}`, () => {
      const first = parseEntry(xml);
      const serialized = serializeEntry(first);
      const reparsedDom = new DOMParser().parseFromString(serialized, "text/xml");
      expect(reparsedDom.getElementsByTagName("parsererror")).toHaveLength(0);
      const second = parseEntry(serialized);
      expect(stripKeys(second)).toEqual(stripKeys(first));
      expect(textContent(second)).toEqual(textContent(first));
    });
  }
});
