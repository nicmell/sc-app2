// Unit tests for the markup-spec SynthDef compiler — a pure function from
// collected params + DOM-ordered ugen specs to SCgf bytes. Assertions decode
// the bytes back through the package's parseScgf, so they pin the actual wire
// format (param table, control wiring, specialIndex, channelsArray-last input
// order, registry defaults fill).

import { describe, expect, it } from "vitest";
import { parseScgf } from "@sc-app/synthdef-compiler";
import { compileSynthDef, type UgenSpec } from "@/lib/synthdef/compileSynthDef";

/** The example-plugin "sine" graph, exactly as sc-synthdef collects it. */
const SINE_PARAMS = { freq: 440, amp: 0.2, pan: 0, mute: 0 };
const SINE_SPECS: UgenSpec[] = [
  { name: "osc", type: "SinOsc", rate: "ar", inputs: { freq: "freq" } },
  { name: "sig", type: "BinaryOpUGen", rate: "ar", op: "*", inputs: { a: "osc", b: "amp" } },
  { name: "panned", type: "Pan2", rate: "ar", inputs: { in: "sig", pos: "pan" } },
  { name: "muted", type: "BinaryOpUGen", rate: "ar", op: "*", inputs: { a: "panned", b: "mute" } },
  { name: "out", type: "Out", rate: "ar", inputs: { bus: "0", channelsarray: "muted" } },
];

describe("compileSynthDef", () => {
  it("compiles the example-plugin graph to a well-formed SCgf def", () => {
    const json = parseScgf(compileSynthDef("sine", SINE_PARAMS, SINE_SPECS));

    expect(json.name).toBe("sine");
    // Param table in declaration order, with the declared defaults.
    expect(json.parameters.names).toEqual([
      { name: "freq", index: 0 },
      { name: "amp", index: 1 },
      { name: "pan", index: 2 },
      { name: "mute", index: 3 },
    ]);
    // Defaults round-trip through f32 (SCgf stores floats).
    expect(json.parameters.values).toEqual([440, Math.fround(0.2), 0, 0]);

    // One kr Control node with 4 output slots, then the ugens in DOM order.
    expect(json.ugens.map((u) => u.className)).toEqual([
      "Control",
      "SinOsc",
      "BinaryOpUGen",
      "Pan2",
      "BinaryOpUGen",
      "Out",
    ]);
    expect(json.ugens[0].numOutputs).toBe(4);

    // SinOsc: freq wired to the Control's slot 0, phase from the registry default.
    const sinOsc = json.ugens[1];
    expect(sinOsc.inputs[0]).toEqual({ ugenIndex: 0, outputIndex: 0 });

    // The mul BinaryOpUGen carries the '*' specialIndex.
    expect(json.ugens[2].specialIndex).toBe(2);

    // Pan2: in = SinOsc*amp, pos = Control slot 2, level from the default (1).
    const pan2 = json.ugens[3];
    expect(pan2.inputs[0]).toEqual({ ugenIndex: 2, outputIndex: 0 });
    expect(pan2.inputs[1]).toEqual({ ugenIndex: 0, outputIndex: 2 });
    expect(pan2.inputs[2].ugenIndex).toBe(-1); // constant: the filled default
    expect(json.constants[pan2.inputs[2].outputIndex]).toBe(1);

    // Out: bus constant first, channelsArray ref appended last.
    const out = json.ugens[5];
    expect(out.inputs).toHaveLength(2);
    expect(out.inputs[0].ugenIndex).toBe(-1);
    expect(json.constants[out.inputs[0].outputIndex]).toBe(0);
    expect(out.inputs[1]).toEqual({ ugenIndex: 4, outputIndex: 0 });
  });

  it("wires multi-output references via name:idx and appends array refs last", () => {
    const json = parseScgf(
      compileSynthDef("stereo", { pan: 0 }, [
        { name: "osc", type: "SinOsc", rate: "ar", inputs: { freq: "440" } },
        { name: "panned", type: "Pan2", rate: "ar", inputs: { in: "osc", pos: "pan" } },
        {
          name: "out",
          type: "Out",
          rate: "ar",
          inputs: { bus: "0", channelsarray: "panned:0, panned:1" },
        },
      ]),
    );
    const out = json.ugens.at(-1)!;
    expect(out.inputs).toEqual([
      { ugenIndex: -1, outputIndex: expect.any(Number) }, // bus constant
      { ugenIndex: 2, outputIndex: 0 },
      { ugenIndex: 2, outputIndex: 1 },
    ]);
  });

  it("rejects a synthdef without ugens", () => {
    expect(() => compileSynthDef("empty", {}, [])).toThrow(
      '<sc-synthdef name="empty"> has no <sc-ugen> children',
    );
  });

  it("rejects an unknown UGen type", () => {
    const specs: UgenSpec[] = [{ name: "x", type: "NoSuchUGen", rate: "ar", inputs: {} }];
    expect(() => compileSynthDef("bad", {}, specs)).toThrow('Unknown UGen type: "NoSuchUGen"');
  });

  it("rejects a missing required input", () => {
    // Out has no defaults for bus/channelsArray.
    const specs: UgenSpec[] = [{ name: "out", type: "Out", rate: "ar", inputs: {} }];
    expect(() => compileSynthDef("bad", {}, specs)).toThrow(
      'UGen "out" (Out): missing required input "bus"',
    );
  });

  it("rejects an op-less or unknown-op operator ugen", () => {
    const opless: UgenSpec[] = [
      { name: "x", type: "BinaryOpUGen", rate: "ar", inputs: { a: "1", b: "2" } },
    ];
    expect(() => compileSynthDef("bad", {}, opless)).toThrow(
      'BinaryOpUGen "x" requires an "op" attribute',
    );
    const unknown: UgenSpec[] = [
      { name: "x", type: "BinaryOpUGen", rate: "ar", op: "frobnicate", inputs: { a: "1", b: "2" } },
    ];
    expect(() => compileSynthDef("bad", {}, unknown)).toThrow(
      'BinaryOpUGen "x": unknown operator "frobnicate"',
    );
  });

  it("rejects an unresolvable input reference", () => {
    const specs: UgenSpec[] = [
      { name: "osc", type: "SinOsc", rate: "ar", inputs: { freq: "ghost" } },
    ];
    expect(() => compileSynthDef("bad", {}, specs)).toThrow(
      'Cannot resolve input "ghost" — not a number, UGen id, or param name',
    );
  });
});
