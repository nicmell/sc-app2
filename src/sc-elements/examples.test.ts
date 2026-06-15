// Unit tests over the example plugins — the fast runtime gate (the CDP
// harness, scripts/validate-examples.mjs, remains the full-stack acceptance
// covering the backend upload/XSD path too). Every examples/<category>/
// <name>/index.html runs through the sc-elements parse engine —
// process on a connected <sc-plugin> host in a simulated DOM. Functional
// examples must parse clean; the runtime bad-* fixtures must fail with their
// exact resolveRuntime error (one per error path — the examples/README.md
// table). The five upload-time fixtures are backend (zip/XSD) validation and
// stay harness-only.

import { afterEach, beforeAll, describe, expect, it } from "vitest";

// sc-strudel's editor stack (@strudel/codemirror) is browser-only and won't
// import under happy-dom; it's aliased to an inert stub globally
// (vite.config.ts test.alias). The parse engine never drives it.
import { registerScElements, type ScControl, type ScElement, type ScRange, type ScSynthDef } from "@/sc-elements";
import { compileSynthDef } from "@/lib/synthdef/compileSynthDef";
import { parsePlugin as parseExample } from "@/lib/utils/test/test-utils";

// Entries are index.html by convention; default-plugin uses entry.html.
const ENTRIES = import.meta.glob("/examples/*/*/{index,entry}.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** Backend (zip/XSD) fixtures — no runtime expectation here. */
const UPLOAD_FIXTURES = new Set([
  "bad-metadata",
  "bad-entry-xhtml",
  "bad-entry-schema",
  "bad-asset-type",
  "bad-asset-mismatch",
]);

/** The runtime fixtures' exact first error (the examples/README.md table). */
const RUNTIME_FAILURES: Record<string, string> = {
  "bad-bindings": '<sc-synth name="sine">: duplicate name in scope',
  "bad-node-bind": '<sc-range bind="ghost.freq">: does not match any node in scope',
  "bad-synthdef-bind": '<sc-range bind="sine.freq">: does not match any node in scope',
  "bad-undeclared-control": '<sc-range bind="s1.detune">: control "detune" is not declared on <sc-synth name="s1">',
  "bad-circular-bind": '<sc-var name="a">: circular bind reference detected',
  "bad-forward-ref": '<sc-run>: "s1" is referenced before it is declared',
  "bad-forward-state-ref": '<sc-var>: "b" is referenced before it is declared',
  "bad-synth-target": '<sc-synth bind="fx">: does not match any <sc-synthdef>',
  "bad-unknown-synthdef": '<sc-synth bind="missing">: does not match any <sc-synthdef>',
  "bad-run-bind": '<sc-run>: bind "ghost" does not match any node in scope',
  "bad-ugen-input": '<sc-control name="freq">: requires either a bind or value attribute',
  "bad-ugen-ref": '<sc-ugen name="osc">: input "freq" references unknown "lfo"',
};

interface ExampleCase {
  category: string;
  name: string;
  xml: string;
}

const cases: ExampleCase[] = Object.entries(ENTRIES)
  .map(([path, xml]) => {
    const m = path.match(/^\/examples\/([^/]+)\/([^/]+)\/(?:index|entry)\.html$/)!;
    return { category: m[1], name: m[2], xml };
  })
  .filter((c) => !UPLOAD_FIXTURES.has(c.name))
  .sort((a, b) => a.name.localeCompare(b.name));

const passing = cases.filter((c) => !(c.name in RUNTIME_FAILURES));
const failing = cases.filter((c) => c.name in RUNTIME_FAILURES);

beforeAll(() => {
  registerScElements();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("example discovery", () => {
  it("finds every functional example and every runtime fixture", () => {
    expect(passing.length).toBeGreaterThanOrEqual(10);
    expect(failing.map((c) => c.name).sort()).toEqual(Object.keys(RUNTIME_FAILURES).sort());
  });
});

describe("functional examples parse clean", () => {
  for (const c of passing) {
    it(`${c.category}/${c.name}`, () => {
      expect(() => parseExample(c.xml)).not.toThrow();
    });
  }
});

describe("every example synthdef compiles", () => {
  // Compilation happens at /d_recv time in the load pass, not at parse — so
  // compile each parsed synthdef's collected params/specs here to keep the
  // unit gate proving the whole graph vocabulary the examples use.
  for (const c of passing) {
    it(`${c.category}/${c.name}`, () => {
      const { host } = parseExample(c.xml);
      const defs = [...host.querySelectorAll("sc-synthdef")] as ScSynthDef[];
      for (const def of defs) {
        expect(() => compileSynthDef(def.name, def.params, def.specs)).not.toThrow();
      }
    });
  }
});

describe("runtime fixtures fail with their exact intentional error", () => {
  for (const c of failing) {
    it(`${c.category}/${c.name}`, () => {
      let error: Error | null = null;
      try {
        parseExample(c.xml);
      } catch (e) {
        error = e as Error;
      }
      expect(error?.message).toBe(RUNTIME_FAILURES[c.name]);
    });
  }
});

describe("example-plugin structure", () => {
  it("assigns the runtime values onto the elements (the element IS the runtime)", () => {
    const { host, nodes } = parseExample(cases.find((c) => c.name === "example-plugin")!.xml);
    expect(host._rootScNode).toBe(host);
    expect(host._parentScNode).toBeUndefined();
    expect(host.enabled).toBe(true);
    expect(host.run).toBe(true);
    expect(host._scChildren!.length).toBeGreaterThan(0);
    for (const el of nodes) {
      expect(el._rootScNode).toBe(host);
      if (el !== host) {
        expect(el._parentScNode?._scChildren).toContain(el);
      }
    }
  });

  it("resolves every sc-range bind to an enabled control on the synth", () => {
    const { nodes } = parseExample(cases.find((c) => c.name === "example-plugin")!.xml);
    const ranges = [...nodes].filter(
      (el): el is ScRange => el.tagName.toLowerCase() === "sc-range",
    );
    expect(ranges.length).toBeGreaterThan(0);
    for (const r of ranges) {
      const target = r._targetScNode as ScControl | undefined;
      expect(target).toBeDefined();
      expect(target!.tagName.toLowerCase()).toBe("sc-control");
      expect(target!.enabled).toBe(true);
      expect(nodes.has(target!)).toBe(true);
    }
  });

  it("processes the live element instances themselves", () => {
    const { host, nodes } = parseExample(cases.find((c) => c.name === "example-plugin")!.xml);
    expect(nodes.has(host)).toBe(true);
    const scDescendants = [...host.querySelectorAll("*")].filter((el) =>
      el.tagName.toLowerCase().startsWith("sc-"),
    );
    expect(scDescendants.length).toBeGreaterThan(1);
    for (const el of scDescendants) {
      expect(nodes.has(el as ScElement)).toBe(true);
    }
  });
});
