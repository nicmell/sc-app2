import { describe, expect, it } from "vitest";
import preamble from "@/sc-elements/internal/xsd/preamble.xml?raw";
import { allowedChildren, HTML_BLOCK_TAGS, HTML_INLINE_TAGS } from "../contentModel";

function groupElements(name: string): string[] {
  const body =
    preamble.match(new RegExp(`<xs:group name="${name}">([\\s\\S]*?)</xs:group>`))?.[1] ?? "";
  return [...body.matchAll(/<xs:element ref="([^"]+)"\/>/g)].map((match) => match[1]);
}

describe("content model", () => {
  it("pins specialized sc element children", () => {
    expect([...allowedChildren("sc-row")]).toEqual(["sc-col"]);
    expect([...allowedChildren("sc-synth")]).toEqual(["sc-control"]);
    expect([...allowedChildren("sc-synthdef")]).toEqual(["sc-control", "sc-ugen"]);
  });

  it("keeps inputs as leaves", () => {
    expect(allowedChildren("sc-slider").size).toBe(0);
    expect(allowedChildren("sc-knob").size).toBe(0);
  });

  it("allows all block categories at the plugin root", () => {
    const root = allowedChildren("sc-plugin");
    for (const tag of [
      "div",
      "sc-slider",
      "sc-flex",
      "sc-strudel",
      "sc-var",
      "sc-group",
      "sc-synthdef",
    ]) {
      expect(root.has(tag), tag).toBe(true);
    }
  });

  it("pins HTML constants to the XSD preamble", () => {
    expect([...HTML_BLOCK_TAGS]).toEqual(groupElements("htmlElements"));
    expect([...HTML_INLINE_TAGS]).toEqual(
      groupElements("inlineContent").filter((tag) => !tag.startsWith("sc-")),
    );
  });
});
