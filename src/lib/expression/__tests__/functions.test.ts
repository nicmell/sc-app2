// The function registry: envelope shapes bridged 1:1 from the
// synthdef-compiler's env-registry (the exact Env.asArray runs are pinned
// there too — packages/synthdef-compiler/tests/env.test.ts), pad(), and the
// strict static-value evaluator (tryEvalCallLiteral).

import { describe, expect, it } from "vitest";
import { lookupFunction, tryEvalCallLiteral } from "@/lib/expression";

const call = (name: string, args: (number | string | number[])[]) =>
  lookupFunction(name)!.evalConst(args);

describe("envelope constructors", () => {
  it("adsr(0.01, 0.1, 0.7, 0.3) === Env.adsr(...).asArray (registry parity)", () => {
    expect(call("adsr", [0.01, 0.1, 0.7, 0.3])).toEqual([
      0, 3, 2, -99, 1, 0.01, 5, -4, 0.7, 0.1, 5, -4, 0, 0.3, 5, -4,
    ]);
  });

  it("missing args take the registry defaults (adsr() is the default ADSR)", () => {
    expect(call("adsr", [])).toEqual(call("adsr", [0.01, 0.3, 0.5, 1, 1, 0]));
    expect(call("perc", [])[2]).toBe(-99); // no release node
  });

  it("every scalar shape is callable", () => {
    for (const name of ["adsr", "dadsr", "asr", "cutoff", "perc", "linen", "triangle", "sine"]) {
      const run = call(name, []);
      expect(run.length % 4).toBe(0);
      expect(run.length).toBeGreaterThanOrEqual(8);
    }
  });

  it("pairs/xyc take flat rest-args (sorted, differenced by the registry)", () => {
    // pairs: (t, l)… — 3 points → 2 segments → 12 slots.
    expect(call("pairs", [0, 0, 0.5, 1, 1, 0])).toHaveLength(12);
    // xyc: (t, l, c)… — per-segment numeric curve.
    expect(call("xyc", [0, 0, -4, 1, 1, -4])).toHaveLength(8);
  });

  it("rejects array and string args on scalar slots", () => {
    expect(() => call("adsr", [[1, 2]])).toThrow('"attack" must be a scalar');
    expect(() => call("adsr", ["fast"])).toThrow('"attack" must be a number');
  });
});

describe("pad", () => {
  it("zero-pads to the width", () => {
    expect(call("pad", [[1, 2, 3], 6])).toEqual([1, 2, 3, 0, 0, 0]);
  });

  it("never truncates and rejects junk widths", () => {
    expect(() => call("pad", [[1, 2, 3], 2])).toThrow("width 2 cannot hold 3 values");
    expect(() => call("pad", [[1], 0])).toThrow("width must be a positive integer");
    expect(() => call("pad", [1, 4])).toThrow("first argument must be an array");
  });
});

describe("tryEvalCallLiteral (static value attributes)", () => {
  it("evaluates a known-head call string to number[] (fresh copy per read)", () => {
    const a = tryEvalCallLiteral("pad(adsr(0.02, 0.15, 0.6, 0.3), 36)")!;
    const b = tryEvalCallLiteral("pad(adsr(0.02, 0.15, 0.6, 0.3), 36)")!;
    expect(a).toHaveLength(36);
    expect(a.slice(0, 16)).toEqual([0, 3, 2, -99, 1, 0.02, 5, -4, 0.6, 0.15, 5, -4, 0, 0.3, 5, -4]);
    expect(a).toEqual(b);
    expect(a).not.toBe(b); // memoized VALUE, fresh identity
  });

  it("returns null for non-calls and unknown heads (string semantics keep working)", () => {
    expect(tryEvalCallLiteral("hello, world")).toBeNull();
    expect(tryEvalCallLiteral("foo(bar)")).toBeNull();
    expect(tryEvalCallLiteral("440")).toBeNull();
  });

  it("a KNOWN head with bad args fails LOUD (a typo'd adsr must not become a string)", () => {
    expect(() => tryEvalCallLiteral("adsr(0.1, oops)")).toThrow(
      'a static value cannot reference state ("oops")',
    );
    expect(() => tryEvalCallLiteral("pad(adsr(), 8)")).toThrow("cannot hold 16 values");
    expect(() => tryEvalCallLiteral("step(1, 2)")).toThrow("level/time ARRAYS");
  });

  it("a scalar-producing call string is rejected (static call values are arrays)", () => {
    expect(() => tryEvalCallLiteral("adsr() ? 1 : 2")).toThrow(
      "only numbers, arithmetic, and calls",
    );
  });
});
