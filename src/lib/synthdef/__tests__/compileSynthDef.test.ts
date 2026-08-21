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
          inputs: { bus: "0", channelsarray: "panned.0, panned.1" },
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

  describe("multichannel expansion", () => {
    const OUT = (channels: string): UgenSpec => ({
      name: "out",
      type: "Out",
      rate: "ar",
      inputs: { bus: "0", channelsarray: channels },
    });

    it("an array literal on a scalar input expands the ugen (and it propagates)", () => {
      const json = parseScgf(
        compileSynthDef("x", { amp: 0.2 }, [
          { name: "osc", type: "SinOsc", rate: "ar", inputs: { freq: "440, 443" } },
          {
            name: "sig",
            type: "BinaryOpUGen",
            rate: "ar",
            op: "*",
            inputs: { a: "osc", b: "amp" },
          },
          OUT("sig"),
        ]),
      );
      const oscs = json.ugens.filter((u) => u.className === "SinOsc");
      expect(oscs).toHaveLength(2);
      expect(json.constants).toContain(440);
      expect(json.constants).toContain(443);
      // `sig` expanded too — one op node per SinOsc instance — and the Out
      // tail flattened both channels.
      const ops = json.ugens.filter((u) => u.className === "BinaryOpUGen");
      expect(ops).toHaveLength(2);
      const out = json.ugens.at(-1)!;
      expect(out.inputs).toHaveLength(3); // bus + 2 flattened channels
    });

    it("wraps the shorter operand array (SC's cycle rule)", () => {
      const json = parseScgf(
        compileSynthDef("x", {}, [
          {
            name: "osc",
            type: "SinOsc",
            rate: "ar",
            inputs: { freq: "440, 550, 660", phase: "0, 1" },
          },
          OUT("osc"),
        ]),
      );
      const oscs = json.ugens.filter((u) => u.className === "SinOsc");
      expect(oscs).toHaveLength(3); // max(3, 2)
      const freqOf = (i: number) => json.constants[oscs[i].inputs[0].outputIndex];
      const phaseOf = (i: number) => json.constants[oscs[i].inputs[1].outputIndex];
      expect([freqOf(0), freqOf(1), freqOf(2)]).toEqual([440, 550, 660]);
      expect([phaseOf(0), phaseOf(1), phaseOf(2)]).toEqual([0, 1, 0]); // wrapped
    });

    it("an array PARAM compiles as a control array and feeds EnvGen's tail", () => {
      const env = [0, 1, 2, -99, 1, 0.01, 5, -4, 0, 0.3, 5, -4];
      const json = parseScgf(
        compileSynthDef("x", { gate: 1, env: env }, [
          {
            name: "e",
            type: "EnvGen",
            rate: "kr",
            inputs: { gate: "gate", action: "2", envelope: "env" },
          },
          { name: "osc", type: "SinOsc", rate: "ar", inputs: { freq: "440" } },
          { name: "sig", type: "BinaryOpUGen", rate: "ar", op: "*", inputs: { a: "osc", b: "e" } },
          OUT("sig"),
        ]),
      );
      // One name entry at the array base; scalar param first.
      expect(json.parameters.names).toEqual([
        { name: "gate", index: 0 },
        { name: "env", index: 1 },
      ]);
      expect(json.parameters.values).toEqual([1, ...env].map(Math.fround));
      // The envelope tail is the control array's slots, in order.
      const eg = json.ugens.find((u) => u.className === "EnvGen")!;
      expect(eg.numInputs).toBe(5 + env.length);
      eg.inputs.slice(5).forEach((input, i) => {
        expect(input).toEqual({ ugenIndex: 0, outputIndex: 1 + i });
      });
    });

    it("a literal comma-list feeds a variadic input directly", () => {
      const env = [0, 1, 2, -99, 1, 0.01, 5, -4, 0, 0.3, 5, -4];
      const json = parseScgf(
        compileSynthDef("x", { gate: 1 }, [
          {
            name: "e",
            type: "EnvGen",
            rate: "kr",
            inputs: { gate: "gate", action: "2", envelope: env.join(", ") },
          },
          { name: "osc", type: "SinOsc", rate: "ar", inputs: { freq: "440" } },
          { name: "sig", type: "BinaryOpUGen", rate: "ar", op: "*", inputs: { a: "osc", b: "e" } },
          OUT("sig"),
        ]),
      );
      const eg = json.ugens.find((u) => u.className === "EnvGen")!;
      expect(eg.numInputs).toBe(5 + env.length);
      const tail = eg.inputs.slice(5).map((i) => {
        expect(i.ugenIndex).toBe(-1);
        return json.constants[i.outputIndex];
      });
      expect(tail).toEqual(env.map(Math.fround));
    });

    it("a name.idx dot ref selects a control-array SLOT (also inside expressions)", () => {
      const env = [0, 2, 1, -99, 1, 0.1, 5, -4, 0, 0.3, 5, -4];
      const json = parseScgf(
        compileSynthDef("x", { env }, [
          // env.5 = seg 0's time; the expression form must resolve too.
          { name: "osc", type: "SinOsc", rate: "kr", inputs: { freq: "env.5" } },
          {
            name: "sum",
            type: "BinaryOpUGen",
            rate: "kr",
            op: "+",
            inputs: { a: "env.5 + env.9", b: "osc" },
          },
          { name: "out", type: "Out", rate: "kr", inputs: { bus: "0", channelsarray: "sum" } },
        ]),
      );
      // SinOsc's freq input = the Control node's output slot 5.
      const osc = json.ugens.find((u) => u.className === "SinOsc")!;
      expect(osc.inputs[0]).toEqual({ ugenIndex: 0, outputIndex: 5 });
      // The expression's add reads slots 5 and 9 off the same Control node.
      const add = json.ugens.find((u) => u.className === "BinaryOpUGen" && u.specialIndex === 0)!;
      expect(add.inputs).toEqual([
        { ugenIndex: 0, outputIndex: 5 },
        { ugenIndex: 0, outputIndex: 9 },
      ]);
    });

    it("rejects an out-of-range slot and deep dots", () => {
      const specs = (input: string): UgenSpec[] => [
        { name: "osc", type: "SinOsc", rate: "kr", inputs: { freq: input } },
        { name: "out", type: "Out", rate: "kr", inputs: { bus: "0", channelsarray: "osc" } },
      ];
      const env = [0, 1, 0, -99, 1, 0.1, 5, -4];
      expect(() => compileSynthDef("x", { env }, specs("env.99"))).toThrow(
        'control array "env" has only 8 slots',
      );
      expect(() => compileSynthDef("x", { env }, specs("env.5.2"))).toThrow(
        'Cannot resolve input "env.5.2"',
      );
    });

    it("an array expression lowers element-wise and name.idx maps per instance", () => {
      const json = parseScgf(
        compileSynthDef("x", { spread: 2 }, [
          { name: "osc", type: "SinOsc", rate: "ar", inputs: { freq: "220, 330 * spread" } },
          { name: "panned", type: "Pan2", rate: "ar", inputs: { in: "osc.0", pos: "0" } },
          OUT("panned.0, panned.1"),
        ]),
      );
      // The comma-list mixes a literal and an expression: one mul op node.
      expect(json.ugens.filter((u) => u.className === "BinaryOpUGen")).toHaveLength(1);
      expect(json.ugens.filter((u) => u.className === "SinOsc")).toHaveLength(2);
      // osc:0 on the EXPANDED osc = output 0 of each instance → Pan2 expands.
      expect(json.ugens.filter((u) => u.className === "Pan2")).toHaveLength(2);
    });
  });

  describe("expression lowering", () => {
    it("lowers `freq * 2` to a BinaryOpUGen feeding the ugen", () => {
      const json = parseScgf(
        compileSynthDef("x", { freq: 440 }, [
          { name: "osc", type: "SinOsc", rate: "ar", inputs: { freq: "freq * 2" } },
          { name: "out", type: "Out", rate: "ar", inputs: { bus: "0", channelsarray: "osc" } },
        ]),
      );
      // Control, then the synthesized mul (emitted while resolving SinOsc's
      // input), then SinOsc, then Out.
      expect(json.ugens.map((u) => u.className)).toEqual([
        "Control",
        "BinaryOpUGen",
        "SinOsc",
        "Out",
      ]);
      const mul = json.ugens[1];
      expect(mul.specialIndex).toBe(2); // '*'
      expect(mul.inputs[0]).toEqual({ ugenIndex: 0, outputIndex: 0 }); // freq control slot
      expect(mul.inputs[1].ugenIndex).toBe(-1); // constant 2
      expect(json.constants[mul.inputs[1].outputIndex]).toBe(2);
      // SinOsc's freq now references the mul node's output.
      expect(json.ugens[2].inputs[0]).toEqual({ ugenIndex: 1, outputIndex: 0 });
    });

    it("lowers a ternary to Select(which, [else, then]) with a binarized cond", () => {
      const json = parseScgf(
        compileSynthDef("x", { gate: 1, freq: 440 }, [
          { name: "osc", type: "SinOsc", rate: "kr", inputs: { freq: "gate ? freq : 220" } },
          { name: "out", type: "Out", rate: "kr", inputs: { bus: "0", channelsarray: "osc" } },
        ]),
      );
      expect(json.ugens.map((u) => u.className)).toEqual([
        "Control",
        "BinaryOpUGen", // gate != 0 (truthiness parity — Select truncates)
        "Select",
        "SinOsc",
        "Out",
      ]);
      const neq = json.ugens[1];
      expect(neq.specialIndex).toBe(7); // '!='
      expect(neq.inputs[0]).toEqual({ ugenIndex: 0, outputIndex: 0 }); // gate slot
      expect(json.constants[neq.inputs[1].outputIndex]).toBe(0);
      const sel = json.ugens[2];
      expect(sel.inputs[0]).toEqual({ ugenIndex: 1, outputIndex: 0 }); // which = the neq
      expect(json.constants[sel.inputs[1].outputIndex]).toBe(220); // index 0 → ELSE
      expect(sel.inputs[2]).toEqual({ ugenIndex: 0, outputIndex: 1 }); // index 1 → THEN (freq)
    });

    it("a comparison cond feeds Select directly (already 1/0)", () => {
      const json = parseScgf(
        compileSynthDef("x", { freq: 440 }, [
          { name: "osc", type: "SinOsc", rate: "kr", inputs: { freq: "freq > 800 ? 800 : freq" } },
          { name: "out", type: "Out", rate: "kr", inputs: { bus: "0", channelsarray: "osc" } },
        ]),
      );
      // Exactly ONE BinaryOpUGen — the `>`; no extra `!= 0`.
      const bins = json.ugens.filter((u) => u.className === "BinaryOpUGen");
      expect(bins).toHaveLength(1);
      expect(bins[0].specialIndex).toBe(9); // '>'
      expect(json.ugens.filter((u) => u.className === "Select")).toHaveLength(1);
    });

    it("a ternary over array branches expands element-wise, sharing the cond", () => {
      const json = parseScgf(
        compileSynthDef("x", { gate: 1, a: [1, 2], b: [3, 4] }, [
          {
            name: "out",
            type: "Out",
            rate: "kr",
            inputs: { bus: "0", channelsarray: "gate ? a : b" },
          },
        ]),
      );
      // One shared binarize node, one Select per channel.
      expect(json.ugens.filter((u) => u.className === "BinaryOpUGen")).toHaveLength(1);
      const sels = json.ugens.filter((u) => u.className === "Select");
      expect(sels).toHaveLength(2);
      // Each Select: [which, b_i (else), a_i (then)] — a slots 1,2; b slots 3,4.
      sels.forEach((sel, i) => {
        expect(sel.inputs[1]).toEqual({ ugenIndex: 0, outputIndex: 3 + i });
        expect(sel.inputs[2]).toEqual({ ugenIndex: 0, outputIndex: 1 + i });
      });
    });

    it("lowers unary minus to a UnaryOpUGen (neg)", () => {
      const json = parseScgf(
        compileSynthDef("x", { a: 1 }, [
          { name: "out", type: "Out", rate: "ar", inputs: { bus: "0", channelsarray: "-a" } },
        ]),
      );
      const neg = json.ugens.find((u) => u.className === "UnaryOpUGen")!;
      expect(neg.specialIndex).toBe(0); // 'neg'
      expect(neg.inputs[0]).toEqual({ ugenIndex: 0, outputIndex: 0 }); // the `a` control
    });

    it("lowers a nested expression `(a + b) * 2` into two op nodes in order", () => {
      const json = parseScgf(
        compileSynthDef("x", { a: 1, b: 2 }, [
          {
            name: "out",
            type: "Out",
            rate: "ar",
            inputs: { bus: "0", channelsarray: "(a + b) * 2" },
          },
        ]),
      );
      const ops = json.ugens.filter((u) => u.className === "BinaryOpUGen");
      expect(ops.map((o) => o.specialIndex)).toEqual([0, 2]); // '+' emitted before '*'
      // the '*' node takes the '+' node then the constant 2
      const mul = ops[1];
      const addIdx = json.ugens.indexOf(ops[0]);
      expect(mul.inputs[0]).toEqual({ ugenIndex: addIdx, outputIndex: 0 });
    });

    it("infers the op-node rate from its operands (audio wins)", () => {
      const json = parseScgf(
        compileSynthDef("x", {}, [
          { name: "osc", type: "SinOsc", rate: "ar", inputs: { freq: "440" } },
          {
            name: "out",
            type: "Out",
            rate: "ar",
            inputs: { bus: "0", channelsarray: "osc * 0.5" },
          },
        ]),
      );
      const mul = json.ugens.find((u) => u.className === "BinaryOpUGen")!;
      expect(mul.rate).toBe(2); // audio (osc is ar; a control-rate default would be 1)
    });

    it("lowers a comparison to the matching BinaryOpUGen", () => {
      const json = parseScgf(
        compileSynthDef("x", { gate: 1 }, [
          { name: "o", type: "SinOsc", rate: "ar", inputs: { freq: "gate > 0" } },
          { name: "out", type: "Out", rate: "ar", inputs: { bus: "0", channelsarray: "o" } },
        ]),
      );
      expect(json.ugens.find((u) => u.className === "BinaryOpUGen")!.specialIndex).toBe(9); // '>'
    });

    it("a constant envelope call feeds EnvGen's variadic envelope input", () => {
      const json = parseScgf(
        compileSynthDef("x", { gate: 1 }, [
          {
            name: "e",
            type: "EnvGen",
            rate: "kr",
            inputs: { gate: "gate", action: "2", envelope: "adsr(0.01, 0.1, 0.7, 0.3)" },
          },
          { name: "out", type: "Out", rate: "kr", inputs: { bus: "0", channelsarray: "e" } },
        ]),
      );
      const eg = json.ugens.find((u) => u.className === "EnvGen")!;
      expect(eg.numInputs).toBe(5 + 16);
      const tail = eg.inputs.slice(5).map((i) => {
        expect(i.ugenIndex).toBe(-1);
        return json.constants[i.outputIndex];
      });
      expect(tail).toEqual(
        [0, 3, 2, -99, 1, 0.01, 5, -4, 0.7, 0.1, 5, -4, 0, 0.3, 5, -4].map(Math.fround),
      );
    });

    it("modulatable envelope args pass PARAM REFS through (live server-side ADSR)", () => {
      const json = parseScgf(
        compileSynthDef("x", { att: 0.01, rel: 0.3, gate: 1 }, [
          {
            name: "e",
            type: "EnvGen",
            rate: "kr",
            inputs: { gate: "gate", envelope: "adsr(att, 0.1, 0.5, rel)" },
          },
          { name: "out", type: "Out", rate: "kr", inputs: { bus: "0", channelsarray: "e" } },
        ]),
      );
      const eg = json.ugens.find((u) => u.className === "EnvGen")!;
      // Run layout: [start, n, rel, loop, l1, t1, c1, v1, …] — t1 (attack)
      // is run index 5 → EnvGen input 5+5; t3 (release) run index 13.
      expect(eg.inputs[5 + 5]).toEqual({ ugenIndex: 0, outputIndex: 0 }); // att slot
      expect(eg.inputs[5 + 13]).toEqual({ ugenIndex: 0, outputIndex: 1 }); // rel slot
    });

    it("a ref on a constant-only envelope arg throws the registry's honest error", () => {
      expect(() =>
        compileSynthDef("x", { s: 0.5, gate: 1 }, [
          {
            name: "e",
            type: "EnvGen",
            rate: "kr",
            inputs: { gate: "gate", envelope: "adsr(0.01, 0.1, s, 0.3)" },
          },
          { name: "out", type: "Out", rate: "kr", inputs: { bus: "0", channelsarray: "e" } },
        ]),
      ).toThrow('adsr: "sustain" is not modulatable');
    });

    it("rejects an envelope call on a FIXED input (would silently expand ×16)", () => {
      expect(() =>
        compileSynthDef("x", { gate: 1 }, [
          { name: "osc", type: "SinOsc", rate: "kr", inputs: { freq: "adsr(0.01)" } },
          { name: "out", type: "Out", rate: "kr", inputs: { bus: "0", channelsarray: "osc" } },
        ]),
      ).toThrow("array-producing calls only feed variadic inputs");
    });

    it("rejects a string literal in a graph expression", () => {
      expect(() =>
        compileSynthDef("x", { a: 1 }, [
          { name: "out", type: "Out", rate: "ar", inputs: { bus: "0", channelsarray: "a + 'hi'" } },
        ]),
      ).toThrow(/string literal is not allowed/);
    });
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
