import { describe, expect, it } from "vitest";
import { createElement } from "@/lib/editor/model";
import { parseEntry } from "@/lib/editor/parse";
import { serializeEntry } from "@/lib/editor/serialize";
import { SPECS } from "@/sc-elements/internal/xsd/registry";
import { HTML_PALETTE_TAGS, PALETTE_META } from "../paletteMeta";

const CHILD_ONLY = new Set(["sc-option", "sc-radio"]);

describe("palette metadata", () => {
  it("provides round-trippable, minimally valid templates", () => {
    for (const [tag, meta] of Object.entries(PALETTE_META)) {
      const template = meta.template();
      expect(template.tag, tag).toBe(tag);
      const xml = serializeEntry(createElement("sc-plugin", {}, [template]));
      expect(() => parseEntry(xml), tag).not.toThrow();
      expect(serializeEntry(parseEntry(xml)), tag).toBe(xml);

      for (const [name, attr] of Object.entries(SPECS.get(tag)?.attrs ?? {})) {
        if (attr.required) {
          expect(
            template.attrs[name] ?? template.attrs[`bind:${name}`],
            `${tag}.${name}`,
          ).toBeDefined();
        }
      }
    }
  });

  it("covers every user-droppable spec exactly once", () => {
    const expected = [...SPECS.keys()]
      .filter((tag) => tag !== "sc-plugin" && !CHILD_ONLY.has(tag))
      .sort();
    const specTags = Object.keys(PALETTE_META).filter((tag) => SPECS.has(tag));
    expect([...new Set(specTags)].sort()).toEqual(expected);
    expect(specTags).toHaveLength(expected.length);
    expect(HTML_PALETTE_TAGS).toEqual(["div", "p", "span", "h1", "h2", "h3", "label"]);
  });
});
