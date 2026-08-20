// Unit tests over the example plugins — the frontend static wasm gate and
// runtime parse engine (the CDP harness, scripts/validate-examples.mjs, remains
// the full-stack acceptance covering the backend upload/XSD path too). Every
// examples/<category>/<name>/index.html runs through parseEntry, then the
// sc-elements runtime engine on a disconnected <sc-plugin> host in happy-dom.
// Functional examples must parse clean; each bad-* fixture must fail with its
// exact intentional error (the examples/README.md table). The five upload-time
// fixtures are backend (zip/XSD) validation and stay harness-only.

import { afterEach, beforeAll, describe, expect, it } from "vitest";

// sc-strudel's editor stack (@strudel/codemirror) is browser-only and won't
// import under happy-dom; it's aliased to an inert stub globally
// (vite.config.ts test.alias). The parse engine never drives it.
import {
  registerScElements,
  type ScControl,
  type ScElement,
  type ScKnob,
  type ScPlugin,
  type ScSlider,
  type ScSynthDef,
} from "@/sc-elements";
import { compileSynthDef } from "@/lib/synthdef/compileSynthDef";
import { parseEntry } from "@/lib/plugins/PluginManager";

// Entries are index.html by convention; default-plugin uses entry.html.
const ENTRIES = import.meta.glob<string>("/examples/*/*/{index,entry}.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

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
  "bad-node-bind": '<sc-knob bind:value="ghost.freq">: does not match any node in scope',
  "bad-synthdef-bind": '<sc-knob bind:value="sine.freq">: does not match any node in scope',
  "bad-undeclared-control":
    '<sc-knob bind:value="s1.detune">: control "detune" is not declared on <sc-synth name="s1">',
  "bad-circular-bind": '<sc-var name="a">: circular bind reference detected',
  "bad-forward-ref": '<sc-button>: "s1" is referenced before it is declared',
  "bad-forward-state-ref": '<sc-var>: "b" is referenced before it is declared',
  "bad-synth-target": '<sc-synth synthdef="fx">: does not match any <sc-synthdef>',
  "bad-unknown-synthdef": '<sc-synth synthdef="missing">: does not match any <sc-synthdef>',
  "bad-ugen-input": '<sc-control name="freq">: requires either a value or bind:value attribute',
  "bad-ugen-ref": '<sc-ugen name="osc">: input "freq" references unknown "lfo"',
  "bad-if-shadow": '<sc-var name="x">: duplicate name in scope',
  "bad-name-syntax":
    '<sc-var>: "name" attribute must be a plain identifier — letters, digits, "_", "-" (got "s1.freq")',
  "bad-runtime-conflict": '<sc-var>: "value" and "bind:value" are mutually exclusive',
  "bad-param-bind": '<sc-control>: "bind:value" is not allowed on a synthdef param',
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

function parseExample(xml: string): { host: ScPlugin; nodes: Set<ScElement> } {
  const host = parseEntry(xml);
  return { host, nodes: host.processRoot() };
}

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
  // unit gate proving the whole graph vocabulary the examples use. A LIVE
  // envelope's flatValue reads the state's default (no store yet at parse) —
  // the ScEnv element already satisfies the EnvStateRef surface, so the def
  // compiles as-is.
  for (const c of passing) {
    it(`${c.category}/${c.name}`, () => {
      const { host } = parseExample(c.xml);
      const defs = [...host.querySelectorAll("sc-synthdef")] as ScSynthDef[];
      for (const def of defs) {
        expect(() =>
          compileSynthDef(def.getProp("name") as string, def.params, def.specs),
        ).not.toThrow();
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
    expect(host._scChildren.length).toBeGreaterThan(0);
    for (const el of nodes) {
      expect(el._rootScNode).toBe(host);
      if (el !== host) {
        expect(el._parentScNode?._scChildren).toContain(el);
      }
    }
  });

  it("resolves every sc-slider/sc-knob bind:value to an enabled control on the synth", () => {
    const { nodes } = parseExample(cases.find((c) => c.name === "example-plugin")!.xml);
    const inputs = [...nodes].filter((el): el is ScSlider | ScKnob =>
      ["sc-slider", "sc-knob"].includes(el.tagName.toLowerCase()),
    );
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) {
      // A plain-path bind:value resolves to exactly one writable state target.
      const prop = input.runtimeProps?.value;
      expect(prop).toBeDefined();
      expect(prop!.expression).toBeUndefined();
      const targets = Object.values(prop!.targets);
      expect(targets).toHaveLength(1);
      const target = targets[0] as ScControl;
      expect(target.tagName.toLowerCase()).toBe("sc-control");
      expect(nodes.has(target)).toBe(true);
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
