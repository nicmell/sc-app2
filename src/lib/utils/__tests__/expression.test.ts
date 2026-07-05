// @vitest-environment node
//
// The bind-expression parser + evaluator, including the comparison layer
// (non-associative, above additive, evaluating to 1/0 — the truthiness the
// derived visuals consume).

import { describe, expect, it } from "vitest";
import { evalExpr, parseBind } from "@/lib/utils/expression";

const evaluate = (input: string, values: Record<string, number> = {}) =>
  evalExpr(parseBind(input).expression!, values);

describe("parseBind", () => {
  it("keeps the plain-path fast path (no expression)", () => {
    expect(parseBind("vars.freq")).toEqual({ paths: ["vars.freq"] });
    expect(parseBind("  a.b.c ")).toEqual({ paths: ["a.b.c"] });
  });

  it("bare name-shaped binds are paths, even hyphenated — expressions own '-' otherwise", () => {
    expect(parseBind("fm.mod-freq")).toEqual({ paths: ["fm.mod-freq"] });
    expect(parseBind("a-b")).toEqual({ paths: ["a-b"] }); // a name, not a subtraction
    expect(parseBind("a - b").expression).toBeDefined(); // spaced = subtraction
    expect(parseBind("vars.x-1").expression).toBeDefined(); // digit after '-' = subtraction
  });

  it("extracts every referenced path, including comparison operands", () => {
    expect(parseBind("vars.a + vars.b").paths.sort()).toEqual(["vars.a", "vars.b"]);
    expect(parseBind("vars.a > vars.b").paths.sort()).toEqual(["vars.a", "vars.b"]);
  });

  it("rejects chained comparisons (non-associative) and stray operators", () => {
    expect(() => parseBind("a > b > c")).toThrow(/Unexpected character '>'/);
    expect(() => parseBind("a = 1")).toThrow(/Unexpected character '='/);
    expect(() => parseBind("a ! b")).toThrow(/Unexpected character '!'/);
    expect(() => parseBind("1 + 2")).toThrow(/must reference at least one variable/);
  });
});

describe("evalExpr", () => {
  it("keeps the arithmetic semantics (incl. the division-by-zero guard)", () => {
    expect(evaluate("a * 2 + 1", { a: 3 })).toBe(7);
    expect(evaluate("-(a + b)", { a: 1, b: 2 })).toBe(-3);
    expect(evaluate("a / b", { a: 1, b: 0 })).toBe(0);
  });

  it("comparisons evaluate to 1/0", () => {
    expect(evaluate("a > 440", { a: 441 })).toBe(1);
    expect(evaluate("a > 440", { a: 440 })).toBe(0);
    expect(evaluate("a >= 440", { a: 440 })).toBe(1);
    expect(evaluate("a < b", { a: 1, b: 2 })).toBe(1);
    expect(evaluate("a <= b", { a: 3, b: 2 })).toBe(0);
    expect(evaluate("a == 0", { a: 0 })).toBe(1);
    expect(evaluate("a == 0", { a: 0.5 })).toBe(0);
    expect(evaluate("a != 0", { a: 0.5 })).toBe(1);
  });

  it("comparison binds looser than arithmetic", () => {
    expect(evaluate("a + 1 > b * 2", { a: 2, b: 1 })).toBe(1); // 3 > 2
    expect(evaluate("a + 1 > b * 2", { a: 1, b: 1 })).toBe(0); // 2 > 2
  });

  it("plays with unary minus and parenthesized comparisons as operands", () => {
    expect(evaluate("a > -1", { a: 0 })).toBe(1);
    expect(evaluate("(a > 0) * 10", { a: 2 })).toBe(10);
    expect(evaluate("(a > 0) + (b > 0)", { a: 1, b: 0 })).toBe(1);
  });

  it("missing variables default to 0", () => {
    expect(evaluate("ghost == 0")).toBe(1);
  });
});
