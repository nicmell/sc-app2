// Array controls (sclang's `\name.kr([...])`): N consecutive param value
// slots, ONE name entry at the base index (so `/n_setn "name"` writes the
// whole run), N outputs on the shared Control UGen. Round-trips through the
// SCgf reader.

import { expect, test } from "vitest";

import { SynthDef, parseScgf } from "../src/index.js";

test("addControlArray names only its base slot and grows the Control UGen", () => {
  const def = new SynthDef("arr");
  const freq = def.addControl("freq", 440, "control");
  const env = def.addControlArray("env", [0, 2, 1, -99, 1, 0.5], "control");
  expect(env).toHaveLength(6);
  // Wire something so the def validates (Out reading the first env slot).
  def.addUgen("Out", "control", [freq, env[0]], 0, 0);

  const json = parseScgf(def.toBytes());
  expect(json.parameters.values).toEqual([440, 0, 2, 1, -99, 1, 0.5]);
  expect(json.parameters.names).toEqual([
    { name: "freq", index: 0 },
    { name: "env", index: 1 }, // ONE entry at the array's base
  ]);
  const control = json.ugens[0];
  expect(control.className).toBe("Control");
  expect(control.numOutputs).toBe(7); // 1 scalar + 6 array slots

  // Round-trip: fromBytes re-encodes to the same bytes.
  expect(SynthDef.fromBytes(def.toBytes()).toBytes()).toEqual(def.toBytes());
});

test("array controls share the duplicate-name guard", () => {
  const def = new SynthDef("dup");
  def.addControl("env", 1, "control");
  expect(() => def.addControlArray("env", [0, 1], "control")).toThrow("Duplicate control name");
  expect(() => def.addControlArray("empty", [], "control")).toThrow("at least one value");
});
