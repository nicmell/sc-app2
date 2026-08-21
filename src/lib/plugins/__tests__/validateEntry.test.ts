// The @sc-app/validate wrapper contract (the wasm is initialized by the
// global test setup): the canonical error shapes parseEntry relies on —
// parse failures get the XHTML prefix, violations throw newline-joined
// (multi-line — the pre-wrap error boxes render one per line), the root
// check, and the spec-map lookups.

import { describe, expect, it } from "vitest";
import { getSpec, validateEntry } from "@sc-app/validate";
import { wrapXml } from "@/lib/utils/test/test-utils";

describe("validateEntry", () => {
  it("returns the live document element for a valid entry", () => {
    const el = validateEntry(wrapXml(`<sc-slider value="1"/>`));
    expect(el.localName).toBe("sc-plugin");
    expect(el.querySelector("sc-slider")).not.toBeNull();
  });

  it("prefixes parse failures with the XHTML shape", () => {
    expect(() => validateEntry("<sc-plugin><div></sc-plugin>")).toThrow(
      /^plugin entry is not valid XHTML: /,
    );
  });

  it("rejects deep documents before the parser", () => {
    const deep = wrapXml(`${"<div>".repeat(300)}${"</div>".repeat(300)}`);
    expect(() => validateEntry(deep)).toThrow(
      "plugin entry is not valid XHTML: document nested deeper than 256 levels",
    );
  });

  it("joins every violation with a newline, in document order", () => {
    let error: Error | null = null;
    try {
      validateEntry(wrapXml(`<sc-slider/><sc-scope foo="1"/>`));
    } catch (e) {
      error = e as Error;
    }
    expect(error?.message.split("\n")).toEqual([
      '<sc-slider>: missing required "value" attribute',
      '<sc-scope>: unknown attribute "foo"',
    ]);
  });

  it("pins the root check", () => {
    expect(() => validateEntry(`<div xmlns="http://www.w3.org/1999/xhtml"/>`)).toThrow(
      "<div>: plugin entry root must be <sc-plugin> (got <div>)",
    );
  });
});

describe("getSpec", () => {
  it("returns undefined for unknown and html tags, specs for sc tags", () => {
    expect(getSpec("div")).toBeUndefined();
    expect(getSpec("nope")).toBeUndefined();
    expect(getSpec("sc-slider")?.attrs.value).toBeDefined();
  });
});
