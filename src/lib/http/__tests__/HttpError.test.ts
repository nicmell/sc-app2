// The structured envelope parse in HttpError's constructor: the backend's
// {code, message, violations?} JSON becomes typed fields, and anything else
// (ws/assets text bodies, proxy pages, empty bodies) falls back to the raw
// text path — the shape resolveSession's tests construct.

import { describe, expect, it } from "vitest";
import { HttpError } from "@/lib/http";

describe("HttpError", () => {
  it("parses the ApiError envelope: code + headline message", () => {
    const error = new HttpError(
      404,
      "Not Found",
      JSON.stringify({ code: "session-unknown", message: "session abc not found" }),
    );
    expect(error.code).toBe("session-unknown");
    expect(error.message).toBe("session abc not found");
    expect(error.violations).toBeUndefined();
  });

  it("carries the spec gate's structured violations through", () => {
    const violation = {
      tag: "sc-slider",
      kind: { code: "missing-required-attr", attr: "value" },
      line: 3,
      column: 5,
      message: '<sc-slider>: missing required "value" attribute (3:5)',
    };
    const error = new HttpError(
      400,
      "Bad Request",
      JSON.stringify({
        code: "plugin-spec-violations",
        message: "entry file does not conform to the sc-plugin spec",
        violations: [violation],
      }),
    );
    expect(error.code).toBe("plugin-spec-violations");
    expect(error.message).toBe("entry file does not conform to the sc-plugin spec");
    expect(error.violations).toEqual([violation]);
  });

  it("falls back to the raw text body for non-envelope responses", () => {
    const error = new HttpError(404, "Not Found", "not found: /nope\n");
    expect(error.message).toBe("not found: /nope\n");
    expect(error.code).toBeUndefined();
  });

  it("ignores JSON that is not the envelope shape", () => {
    const error = new HttpError(500, "Internal Server Error", '{"unrelated": true}');
    expect(error.message).toBe('{"unrelated": true}');
    expect(error.code).toBeUndefined();
  });

  it("falls back to status + statusText on an empty body", () => {
    expect(new HttpError(502, "Bad Gateway").message).toBe("502 Bad Gateway");
    expect(new HttpError(502, "Bad Gateway", "").message).toBe("502 Bad Gateway");
  });
});
