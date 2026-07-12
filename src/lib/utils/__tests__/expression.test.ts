// @vitest-environment node
//
// The bind-expression parser + evaluator, including the comparison layer
// (non-associative, above additive, evaluating to 1/0 — the truthiness the
// derived visuals consume), the right-associative ternary above it, and
// single-quoted string literals.

import { describe, expect, it } from "vitest";
import { evalExpr, parseBind } from "@/lib/utils/expression";

const evaluate = (input: string, values: Record<string, number | string | number[]> = {}) =>
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

  it("rejects string/ternary malformations (and keeps the variable requirement)", () => {
    expect(() => parseBind("a ? 'on")).toThrow(/Unterminated string/);
    expect(() => parseBind("a ? 1")).toThrow(/Expected ':'/);
    // Constants belong in the static attribute — a bind must reference state.
    expect(() => parseBind("1 ? 'a' : 'b'")).toThrow(/must reference at least one variable/);
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

  it("ternary selects on truthiness and is right-associative", () => {
    expect(evaluate("a ? 10 : 20", { a: 1 })).toBe(10);
    expect(evaluate("a ? 10 : 20", { a: 0 })).toBe(20);
    expect(evaluate("a > 440 ? 1 : 0", { a: 441 })).toBe(1); // comparison as cond
    expect(evaluate("a ? 1 : b ? 2 : 3", { a: 0, b: 0 })).toBe(3); // nests into the else
    expect(evaluate("a ? b ? 1 : 2 : 3", { a: 1, b: 0 })).toBe(2); // then owns its ':' first
  });

  it("string literals flow through ternaries, ==, and concatenation", () => {
    expect(evaluate("gate ? 'stop' : 'play'", { gate: 1 })).toBe("stop");
    expect(evaluate("gate ? 'stop' : 'play'", { gate: 0 })).toBe("play");
    expect(evaluate("mode == 'lin'", { mode: "lin" })).toBe(1);
    expect(evaluate("mode == 'lin'", { mode: "exp" })).toBe(0);
    expect(evaluate("'f = ' + a", { a: 440 })).toBe("f = 440");
    // Strict equality: no cross-type coercion.
    expect(evaluate("a == '1'", { a: 1 })).toBe(0);
    // The empty string is falsy, like 0.
    expect(evaluate("s ? 1 : 2", { s: "" })).toBe(2);
  });
});

describe("multichannel expansion (evalExpr over arrays)", () => {
  it("maps a scalar across an array (broadcast)", () => {
    expect(evaluate("a * 2", { a: [1, 2, 3] })).toEqual([2, 4, 6]);
    expect(evaluate("10 - a", { a: [1, 2] })).toEqual([9, 8]);
  });

  it("zips two arrays with the shorter cycling (SC's wrap)", () => {
    expect(evaluate("a + b", { a: [1, 2, 3], b: [10, 20] })).toEqual([11, 22, 13]);
  });

  it("unary minus maps", () => {
    expect(evaluate("-a", { a: [1, -2] })).toEqual([-1, 2]);
  });

  it("comparisons yield element-wise 1/0", () => {
    expect(evaluate("a > 1", { a: [0, 1, 2] })).toEqual([0, 0, 1]);
  });

  it("an array ternary cond selects element-wise across both branches", () => {
    expect(evaluate("c ? a : 9", { c: [1, 0, 1], a: [10, 20, 30] })).toEqual([10, 9, 30]);
  });

  it("a scalar ternary cond keeps the branch semantics (arrays pass whole)", () => {
    expect(evaluate("g ? a : b", { g: 1, a: [1, 2], b: [3, 4] })).toEqual([1, 2]);
  });
});
