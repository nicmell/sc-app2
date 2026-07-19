// The package's honesty gate against the REAL wasm build: registry content
// (incl. the SCDoc-reconciled entries), graph building + SCgf roundtrips,
// operators, envelope runs (native crate tests own the full env matrix —
// these pin the wasm boundary shapes the app consumes).

import { describe, expect, it } from "vitest";
import {
  binaryOpIndex,
  encodeEnvRun,
  ENV_SHAPES,
  k,
  lookupEnv,
  lookupUgen,
  parseScgf,
  SynthDef,
  u,
  ugenIndex,
  ugensByCategory,
  unaryOpIndex,
  uo,
} from "../src/index.js";
import { In, Out, SinOsc } from "../src/builders.js";

describe("registry (wasm-served)", () => {
  it("carries the full reconciled catalogue", () => {
    const all = ugensByCategory().flatMap(([, es]) => es);
    expect(all.length).toBe(367);
    // SCDoc-reconcile pins (commit 8880a3e / the Rust twin).
    expect(lookupUgen("Blip")!.rates).toEqual(["audio", "control"]);
    expect(lookupUgen("Convolution2")!.defaults.find((d) => d.name === "framesize")!.default).toBe(
      2048,
    );
    expect(lookupUgen("CuspL")!.rates).toEqual(["audio"]);
    expect(lookupUgen("SinOsc")!.defaults.map((d) => d.name)).toEqual(["freq", "phase"]);
    expect(lookupUgen("Nope")).toBeNull();
  });
});

describe("SynthDef class", () => {
  it("builds and round-trips the sine graph", () => {
    const def = new SynthDef("sine");
    const freq = def.addControl("freq", 440, "control");
    const osc = def.addUgen("SinOsc", "audio", [freq, k(0)], 1, 0);
    def.addUgen("Out", "audio", [k(0), u(osc)], 0, 0);
    expect(def.nodeRate(1)).toBe("audio");

    const bytes = def.toBytes();
    const json = parseScgf(bytes);
    expect(json.name).toBe("sine");
    expect(json.ugens.map((ug) => ug.className)).toEqual(["Control", "SinOsc", "Out"]);
    expect(json.parameters.values).toEqual([440]);
  });

  it("array controls name only the base slot", () => {
    const def = new SynthDef("envArr");
    def.addControl("freq", 440, "control");
    const slots = def.addControlArray("env", Float32Array.from([0, 2, -99, -99]), "control");
    expect(slots).toHaveLength(4);
    const json = parseScgf(def.toBytes());
    expect(json.parameters.values).toEqual([440, 0, 2, -99, -99]);
    expect(json.parameters.names).toEqual([
      { name: "freq", index: 0 },
      { name: "env", index: 1 },
    ]);
  });

  it("typed wasm builders compose inside the graph callback", () => {
    const def = new SynthDef("tap", (def) => {
      const inRef = In.ar({ bus: def.addControl("inBus", 0, "control"), numChannels: 2 });
      const idx = ugenIndex(inRef)!;
      Out.ar({ bus: 0, channelsArray: [uo(idx, 0), uo(idx, 1)] });
    });
    const json = parseScgf(def.toBytes());
    expect(json.ugens.map((ug) => ug.className)).toEqual(["Control", "In", "Out"]);
    expect(json.ugens[1].numOutputs).toBe(2);

    // Nested builds are legal — the ambient stack restores the outer def.
    const def2 = new SynthDef("t2", () => {
      const inner = new SynthDef("inner", () => {
        Out.ar({ bus: 0, channelsArray: [SinOsc.ar({ freq: 330 })] });
      });
      expect(parseScgf(inner.toBytes()).constants).toContain(330);
      Out.ar({ bus: 0, channelsArray: [SinOsc.ar({ freq: 220 })] });
    });
    expect(parseScgf(def2.toBytes()).constants).toContain(220);
  });

  it("builders outside a graph callback fail with a pointed error", () => {
    expect(() => SinOsc.ar({ freq: 440 })).toThrowError(
      /SinOsc\.ar: no SynthDef under construction/,
    );
  });

  it("an async graph callback is rejected", () => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- the misuse under test
    expect(() => new SynthDef("nope", async () => {})).toThrowError(/must be synchronous/);
  });
});

describe("operators", () => {
  it("special indices match scsynth's tables", () => {
    expect(binaryOpIndex("+")).toBe(0);
    expect(binaryOpIndex("*")).toBe(2);
    expect(binaryOpIndex("!=")).toBe(7);
    expect(unaryOpIndex("neg")).toBe(0);
    expect(binaryOpIndex("nope")).toBeUndefined();
  });
});

describe("envelopes", () => {
  it("ENV_SHAPES metadata + buildRun match the crate", () => {
    expect(ENV_SHAPES).toHaveLength(12);
    const adsr = lookupEnv("adsr")!;
    expect(adsr.releaseNode).toBe(2);
    expect(adsr.args.map((a) => a.name)).toEqual([
      "attack",
      "decay",
      "sustain",
      "release",
      "peak",
      "bias",
    ]);
    const run = adsr.buildRun({}).map((i) => ("constant" in i ? Math.fround(i.constant) : i));
    expect(run.slice(0, 8)).toEqual([0, 3, 2, -99, 1, 0.01, 5, -4].map(Math.fround));
  });

  it("modulatable slots take refs; arithmetic slots throw the pinned error", () => {
    const run = lookupEnv("adsr")!.buildRun({ attack: { ugen: 3 } });
    expect(run[5]).toEqual({ ugen: 3 });
    expect(() => lookupEnv("adsr")!.buildRun({ sustain: { ugen: 3 } })).toThrow(
      'adsr: "sustain" is not modulatable',
    );
  });

  it("encodeEnvRun flattens raw specs (the editor path)", () => {
    const run = encodeEnvRun([0, 1, 0], [0.25, 0.5], ["lin", "sin"], 1, undefined).map((i) =>
      "constant" in i ? i.constant : i,
    );
    expect(run).toEqual([0, 2, 1, -99, 1, 0.25, 1, 0, 0, 0.5, 3, 0]);
  });
});
