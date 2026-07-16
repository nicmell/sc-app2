import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { adoptEntry } from "@/lib/plugins/PluginManager";
import { registerScElements, type ScPlugin } from "@/sc-elements";
import { parsePlugin, wrapXml } from "@/lib/utils/test/test-utils";
import { buildDomMap } from "../domMap";
import type { EditorNode } from "../model";
import { parseEntry } from "../parse";

beforeAll(() => registerScElements());
afterEach(() => document.body.replaceChildren());

const elements = (node: EditorNode): EditorNode[] =>
  node.kind === "text" ? [] : [node, ...node.children.flatMap(elements)];

describe("buildDomMap", () => {
  it("maps every model element to the matching preview element", () => {
    const xml = wrapXml(`<sc-row><sc-col><sc-text>Hello</sc-text></sc-col></sc-row>`);
    const doc = parseEntry(xml);
    const { host } = parsePlugin(xml);
    const map = buildDomMap(host, doc);
    const nodes = elements(doc);

    expect(map.byKey.size).toBe(nodes.length);
    expect(map.byKey.get(doc.key)).toBe(host);
    for (const node of nodes) {
      if (node.kind !== "element" || node === doc) continue;
      const expected = host.querySelector(node.tag);
      expect(map.byKey.get(node.key)).toBe(expected);
      expect(map.keyOf.get(expected!)).toBe(node.key);
    }
  });

  it("maps adopted markup even when runtime processing would fail", () => {
    const xml = wrapXml(`<sc-var name="value" value="1" bogus="unknown"/>`);
    const doc = parseEntry(xml);
    const parsed = new DOMParser().parseFromString(xml, "text/xml");
    const host = document.createElement("sc-plugin") as ScPlugin;
    document.body.appendChild(host);
    adoptEntry(host, parsed);

    const map = buildDomMap(host, doc);
    expect(map.byKey.size).toBe(elements(doc).length);
    expect(map.byKey.get(doc.children[0].key)).toBe(host.querySelector("sc-var"));
  });
});
