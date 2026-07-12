// Array-valued state through the generic control plane: a comma-list `value`
// parses to number[]; a synth's INSTANCE array controls are baked INTO the
// /s_new as consecutive index/value pairs (no post-create seed; def params
// without one keep their compiled defaults); a write dispatches ONE /n_setn
// on the owning node (group-level writes fan to every voice); sc-var arrays
// ride the same store/statechange seam; derived array expressions recompute
// with multichannel expansion.

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { OSC } from "@sc-app/server-commands";
import { registerScElements, type ScControl, type ScVar } from "@/sc-elements";
import { installScsynthMock, mountPlugin, parsePlugin, wrapXml } from "@/lib/utils/test/test-utils";

let sent: OSC.Message[];

const PLUGIN = wrapXml(`<sc-synthdef name="voice">
    <sc-control name="freq" value="440"/>
    <sc-control name="gate" value="1"/>
    <sc-control name="env" value="0, 1, 0, -99, 1, 0.01, 5, -4"/>
    <sc-ugen name="e" type="EnvGen" rate="kr">
      <sc-control name="gate" bind:value="gate"/>
      <sc-control name="envelope" bind:value="env"/>
    </sc-ugen>
    <sc-ugen name="osc" type="SinOsc"><sc-control name="freq" bind:value="freq"/></sc-ugen>
    <sc-ugen name="out" type="Out">
      <sc-control name="bus" value="0"/><sc-control name="channelsarray" bind:value="osc * e, osc * e"/>
    </sc-ugen>
  </sc-synthdef>
  <sc-synth name="s1" synthdef="voice">
    <sc-control name="freq" value="440"/>
    <sc-control name="gate" value="1"/>
    <sc-control name="env" value="0, 1, 0, -99, 1, 0.01, 5, -4"/>
  </sc-synth>`);

beforeAll(() => registerScElements());

beforeEach(() => {
  ({ sent } = installScsynthMock());
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("array-valued controls", () => {
  it("parses the comma-list to number[] and seeds the store with it", async () => {
    const { host } = await mountPlugin(PLUGIN);
    const env = host.querySelector('sc-synth sc-control[name="env"]') as ScControl;
    expect(env._state).toEqual([0, 1, 0, -99, 1, 0.01, 5, -4]);
  });

  it("bakes arrays INTO /s_new as consecutive index/value pairs (no seed message)", async () => {
    const { host } = await mountPlugin(PLUGIN);
    void host;
    const sNew = sent.find((m) => m.address === "/s_new")!;
    expect(sNew.args).not.toContain("env"); // by NAME — slots go by index
    expect(sNew.args).toContain("freq");
    // Def params: freq(1), gate(1), env(8) → env base index 2; the pairs
    // (2,0)(3,1)(4,0)(5,-99)… ride the same /s_new.
    const pairs = sNew.args.slice(4);
    const at = (idx: number) => pairs[pairs.indexOf(idx) + 1];
    expect(at(2)).toBe(0);
    expect(at(3)).toBe(1);
    expect(at(5)).toBe(-99);
    expect(at(9)).toBe(-4);
    // No separate array seed anymore — the create is atomic.
    expect(sent.filter((m) => m.address === "/n_setn")).toHaveLength(0);
  });

  it("a write dispatches ONE /n_setn on the owning node (fresh array per edit)", async () => {
    const { host } = await mountPlugin(PLUGIN);
    const synth = host.querySelector("sc-synth") as unknown as { nodeId: number };
    const env = host.querySelector('sc-synth sc-control[name="env"]') as ScControl;
    sent.length = 0;

    env.setValue([0, 1, 0, -99, 1, 0.5, 5, -4]);
    expect((env._state as number[])[5]).toBe(0.5);
    const setns = sent.filter((m) => m.address === "/n_setn");
    expect(setns).toHaveLength(1);
    expect(setns[0].args.slice(0, 3)).toEqual([synth.nodeId, "env", 8]);
    expect(setns[0].args[8]).toBe(0.5);
  });

  it("sc-var arrays feed derived state with multichannel expansion", async () => {
    const { host } = await mountPlugin(
      wrapXml(`<sc-var name="a" value="1, 2, 3"/>
        <sc-var name="doubled" bind:value="a * 2"/>`),
    );
    const doubled = host.querySelector('sc-var[name="doubled"]') as ScVar;
    expect(doubled._state).toEqual([2, 4, 6]);
    const a = host.querySelector('sc-var[name="a"]') as ScVar;
    a.setValue([10, 20]);
    expect(doubled._state).toEqual([20, 40]);
  });

  it("rejects non-numeric control values (scalar or partial comma-list)", () => {
    // "1, abc" is a STRING by the vector grammar (not all-numeric) — and a
    // control's value must be numeric either way.
    expect(() => parsePlugin(wrapXml('<sc-control name="x" value="1, abc"/>'))).toThrow(
      '"value" attribute must be a number or a comma-list of numbers',
    );
    document.body.replaceChildren();
    expect(() => parsePlugin(wrapXml('<sc-control name="x" value="abc"/>'))).toThrow(
      '"value" attribute must be a number or a comma-list of numbers',
    );
  });

  it("keeps a string var stringy even with commas", () => {
    const { host } = parsePlugin(wrapXml(`<sc-var name="s" value="hello, world"/>`));
    const v = host.querySelector("sc-var") as ScVar;
    expect(v.getProp("value")).toBe("hello, world");
  });
});

describe("voice array latching", () => {
  const KEYBOARD_PLUGIN = wrapXml(`<sc-var name="env" value="0, 1, 0, -99, 1, 0.01, 5, -4"/>
    <sc-synthdef name="voice">
      <sc-control name="freq" value="440"/>
      <sc-control name="gate" value="1"/>
      <sc-control name="env" value="0, 1, 0, -99, 1, 0.01, 5, -4"/>
      <sc-ugen name="e" type="EnvGen" rate="kr">
        <sc-control name="gate" bind:value="gate"/>
        <sc-control name="envelope" bind:value="env"/>
      </sc-ugen>
      <sc-ugen name="osc" type="SinOsc"><sc-control name="freq" bind:value="freq"/></sc-ugen>
      <sc-ugen name="out" type="Out">
        <sc-control name="bus" value="0"/><sc-control name="channelsarray" bind:value="osc * e, osc * e"/>
      </sc-ugen>
    </sc-synthdef>
    <sc-keyboard synthdef="voice" bind:envelope="env"/>`);

  it("a keyboard voice spawned AFTER an edit carries the edited array", async () => {
    const { host } = await mountPlugin(KEYBOARD_PLUGIN);
    const env = host.querySelector('sc-var[name="env"]') as ScVar;
    // Edit the plugin-level state BEFORE any voice exists.
    env.setValue([0, 1, 0, -99, 1, 0.77, 5, -4]);
    sent.length = 0;

    const keyboard = host.querySelector("sc-keyboard") as unknown as {
      noteOn(note: number, velocity: number): Promise<void>;
    };
    await keyboard.noteOn(69, 0.5);
    const sNew = sent.find((m) => m.address === "/s_new")!;
    // env base index 2 (freq, gate, env); the edited time sits at slot 5 →
    // index 7. Baked INTO the /s_new — the voice never sounds the default.
    const pairs = sNew.args.slice(4);
    expect(pairs[pairs.indexOf(7) + 1]).toBe(0.77);
    expect(sent.filter((m) => m.address === "/n_setn")).toHaveLength(0);
  });

  it("normalize divides the voice's amp by the latched envelope's peak", async () => {
    const { host } = await mountPlugin(
      KEYBOARD_PLUGIN.replace('<sc-keyboard synthdef="voice" bind:envelope="env"/>',
        '<sc-keyboard synthdef="voice" bind:envelope="env" normalize="true"/>'),
    );
    const env = host.querySelector('sc-var[name="env"]') as ScVar;
    env.setValue([0, 1, 0, -99, 0.5, 0.01, 5, -4]); // peak 0.5
    sent.length = 0;

    const keyboard = host.querySelector("sc-keyboard") as unknown as {
      noteOn(note: number, velocity: number): Promise<void>;
    };
    await keyboard.noteOn(69, 0.4);
    const sNew = sent.find((m) => m.address === "/s_new")!;
    const pairs = sNew.args.slice(4);
    expect(pairs[pairs.indexOf("amp") + 1]).toBeCloseTo(0.8, 6); // 0.4 / 0.5
  });

  it("an sc-synth without an instance array control keeps the def's compiled defaults", async () => {
    const { host } = await mountPlugin(
      wrapXml(`<sc-control name="env" value="0, 1, 0, -99, 1, 0.42, 5, -4"/>
      <sc-synthdef name="voice">
        <sc-control name="gate" value="1"/>
        <sc-control name="env" value="0, 1, 0, -99, 1, 0.01, 5, -4"/>
        <sc-ugen name="e" type="EnvGen" rate="kr">
          <sc-control name="gate" bind:value="gate"/>
          <sc-control name="envelope" bind:value="env"/>
        </sc-ugen>
        <sc-ugen name="out" type="Out">
          <sc-control name="bus" value="0"/><sc-control name="channelsarray" bind:value="e"/>
        </sc-ugen>
      </sc-synthdef>
      <sc-synth name="s1" synthdef="voice">
        <sc-control name="gate" value="1"/>
      </sc-synth>`),
    );
    void host;
    // No implicit name-matched inheritance from the enclosing plugin-level
    // control: the /s_new carries NO array pairs (the def's compiled
    // defaults apply) and no seed /n_setn follows. Sharing live state is
    // explicit — an instance control, bind:value, or bind:envelope.
    const sNew = sent.find((m) => m.address === "/s_new")!;
    const pairs = sNew.args.slice(4);
    expect(pairs.every((p) => typeof p !== "number" || p !== 6)).toBe(true);
    expect(pairs).toEqual(["gate", 1]);
    expect(sent.filter((m) => m.address === "/n_setn")).toHaveLength(0);
  });
});


