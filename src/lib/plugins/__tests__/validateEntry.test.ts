// The lib/plugins/validate wrapper contract (the wasm is initialized by the
// global test setup): the canonical error shapes parseEntry relies on —
// parse failures get the XHTML prefix, violations throw newline-joined
// (multi-line — the pre-wrap error boxes render one per line), the root
// check, and the spec-map lookups.

import { describe, expect, it } from "vitest";
import {
  EntryParseError,
  getSpec,
  validateEntry,
  ValidationError,
  type ValidationViolation,
} from "@/lib/plugins/validate";

// COMPILE-TIME pin: the tsify-generated union must narrow on `code` (payload
// fields surface per variant, base fields stay reachable). A broken generated
// shape fails `yarn build`'s type-check, not just this suite.
export function narrows(violation: ValidationViolation): string {
  switch (violation.kind.code) {
    case "invalid-enum":
      return violation.kind.allowed.join("|") + violation.kind.attr;
    case "value-below-min":
      return `${violation.kind.min} ${violation.kind.value} ${violation.tag}:${violation.line}`;
    case "unexpected-child":
      return violation.kind.child;
    default:
      return violation.message;
  }
}
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
      /^plugin entry is not valid XHTML: document nested deeper than 256 levels at 2:/,
    );
  });

  it("joins every violation with a newline, in document order, with positions", () => {
    let error: Error | null = null;
    try {
      validateEntry(wrapXml(`<sc-slider/><sc-scope foo="1"/>`));
    } catch (e) {
      error = e as Error;
    }
    expect(error?.message.split("\n")).toEqual([
      '<sc-slider>: missing required "value" attribute (2:78)',
      '<sc-scope>: unknown attribute "foo" (2:100)',
    ]);
    // The structured list rides the error for editor diagnostics: stable
    // code + the rule's own payload + position + the pre-rendered line.
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).violations).toEqual([
      {
        tag: "sc-slider",
        kind: { code: "missing-required-attr", attr: "value" },
        line: 2,
        column: 78,
        message: '<sc-slider>: missing required "value" attribute (2:78)',
      },
      {
        tag: "sc-scope",
        kind: { code: "unknown-attr", attr: "foo" },
        line: 2,
        column: 100,
        message: '<sc-scope>: unknown attribute "foo" (2:100)',
      },
    ]);
  });

  it("classifies parse failures on the thrown EntryParseError", () => {
    let error: EntryParseError | null = null;
    try {
      validateEntry("<sc-plugin><div></sc-plugin>");
    } catch (e) {
      error = e as EntryParseError;
    }
    expect(error).toBeInstanceOf(EntryParseError);
    expect(error?.message).toMatch(/^plugin entry is not valid XHTML: /);
    expect(error?.parseError).toMatchObject({ code: "not-well-formed" });
    expect(error?.parseError?.line).toBeGreaterThanOrEqual(1);
    expect(error?.parseError?.column).toBeGreaterThanOrEqual(1);
  });

  it("pins the root check", () => {
    expect(() => validateEntry(`<div xmlns="http://www.w3.org/1999/xhtml"/>`)).toThrow(
      "<div>: plugin entry root must be <sc-plugin> (got <div>) (1:1)",
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
