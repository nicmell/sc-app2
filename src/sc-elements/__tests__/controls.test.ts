// The functional-element lifecycle gate: example-plugin through the parse
// engine AND the sequential load pass, against a scripted scsynth. The
// oscClient's send is mocked into an auto-responder that acknowledges each
// sequenced command through the real handleReply (so `once()` waiters gate
// the pipeline exactly as against a live server): /g_new → /n_go,
// /d_recv → its embedded /sync completion → /synced, /s_new → /n_go.
// Asserted here: the store seeding and parse purity, the OSC send order and
// payloads, setValue's store + /n_set split, the inputs' read/write wiring
// and DOM updates, display formatting, and unmount cleanup.

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// @strudel/codemirror is browser-only (aliased to an inert stub globally in
// vite.config.ts test.alias); the parse + load pass never drive the editor.
import { OSC } from "@sc-app/server-commands";
import { oscClient } from "@/lib/osc/OscClient";
import { appStore } from "@/stores/store";
import { setRuntimeValue } from "@/stores/runtime";
import {
  registerScElements,
  type ScControl,
  type ScDisplay,
  type ScElement,
  type ScPlugin,
  type ScSynth,
  type ScSynthDef,
  type ScVar,
} from "@/sc-elements";
import { formatValue } from "@/sc-elements/visuals/sc-display";
import {
  autoRespond,
  FIRST_NODE_ID,
  installScsynthMock,
  mountPlugin,
  parsePlugin,
  SESSION_GROUP,
  wrapXml,
} from "@/lib/utils/test/test-utils";
import xml from "/examples/synths/example-plugin/index.html?raw";

let sent: OSC.Message[];
let send: ReturnType<typeof installScsynthMock>["send"];

const parseExample = () => parsePlugin(xml);
const mountExample = () => mountPlugin(xml);

const control = (host: ScPlugin, key: string) =>
  [...host.querySelectorAll("sc-synth sc-control")].find(
    (c) => (c as ScControl).name === key,
  ) as ScControl;

const nSets = () => sent.filter((m) => m.address === "/n_set");

/** The ui-components value widget a sc-slider/sc-knob renders — its value lives
 *  in the base widget's shadow, so tests drive the host (which re-emits a
 *  composed `input`, exactly the event the input listens for). */
type ValueWidget = HTMLElement & { value: number };
const widgetOf = (el: Element) =>
  el.querySelector("sc-base-slider, sc-base-knob") as ValueWidget;
/** The sc-slider/sc-knob wired to a given bind (tag-agnostic — freq is a knob). */
const inputByBind = (host: ScPlugin, bind: string) =>
  host.querySelector(`sc-slider[bind="${bind}"], sc-knob[bind="${bind}"]`) as ScElement & {
    updateComplete: Promise<boolean>;
  };
/** Simulate a user gesture on an input's widget: move the value + re-emit. */
const dragWidget = (input: Element, value: number) => {
  const widget = widgetOf(input);
  widget.value = value;
  widget.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
};

/** The ui-components boolean widget a sc-checkbox/sc-switch renders. */
type ToggleWidget = HTMLElement & { checked: boolean };
const toggleOf = (el: Element) =>
  el.querySelector("sc-base-checkbox, sc-base-switch") as ToggleWidget;
/** Simulate a user gesture on a sc-checkbox/sc-switch: set checked + re-emit. */
const toggleWidget = (input: Element, checked: boolean) => {
  const widget = toggleOf(input);
  widget.checked = checked;
  widget.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
};

/** The ui-components value widget a sc-select/sc-radio-group renders. */
type ChoiceWidget = HTMLElement & { value: number };
const choiceOf = (el: Element) =>
  el.querySelector("sc-base-select, sc-base-radio-group") as ChoiceWidget;
/** Simulate choosing a value on a sc-select/sc-radio-group: set + re-emit. */
const chooseWidget = (input: Element, value: number) => {
  const widget = choiceOf(input);
  widget.value = value;
  widget.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
};

beforeAll(() => {
  registerScElements();
});

beforeEach(() => {
  ({ sent, send } = installScsynthMock());
});

afterEach(() => {
  document.body.replaceChildren(); // disconnects → unload paths run
  appStore.update((s) => ({ ...s, runtime: {}, osc: { ...s.osc, connected: false } }));
});

/** Drive the `connected` signal the plugins live on (the osc slice). */
const setConnected = (connected: boolean) =>
  appStore.update((s) => ({ ...s, osc: { ...s.osc, connected } }));

describe("load pass", () => {
  it("seeds exactly the enabled literal controls' defaults, keyed by full path", async () => {
    const { host } = await mountExample();
    expect(appStore.get().runtime[host.id]).toEqual({
      "s1.freq": 440,
      "s1.amp": 0.2,
      "s1.pan": 0,
      "s1.mute": 0,
    });
  });

  it("parse alone stays store-pure (no seeding before load)", () => {
    parseExample();
    expect(appStore.get().runtime).toEqual({});
    expect(send).not.toHaveBeenCalled();
  });

  it("sends /g_new → /d_recv → /s_new sequentially, each gated by its ack", async () => {
    const { host } = await mountExample();
    expect(sent.map((m) => m.address)).toEqual(["/g_new", "/d_recv", "/s_new"]);

    const groupId = FIRST_NODE_ID;
    expect(sent[0].args).toEqual([groupId, 1, SESSION_GROUP]);

    const synth = host.querySelector("sc-synth") as ScSynth;
    expect(synth.loaded).toBe(true);
    expect(sent[2].args).toEqual([
      "sine",
      synth.nodeId,
      1,
      groupId,
      "freq",
      440,
      "amp",
      0.2,
      "pan",
      0,
      "mute",
      0,
    ]);

    expect(host.nodeId).toBe(groupId);
    expect(host.loaded).toBe(true);
  });

  it("never resolves /s_new before the synthdef's /synced ack", async () => {
    // Withhold the /synced ack: the load pass must stall before /s_new.
    send.mockImplementation((packet) => {
      const msg = packet as OSC.Message;
      sent.push(msg);
      if (msg.address !== "/d_recv") autoRespond(msg);
    });
    const { host } = parseExample();
    let settled = false;
    const loading = host
      .load()
      .catch(() => {})
      .finally(() => (settled = true));
    await new Promise((r) => setTimeout(r, 10));
    expect(settled).toBe(false);
    expect(sent.map((m) => m.address)).toEqual(["/g_new", "/d_recv"]);
    oscClient.close(); // reject the pending waiter so the test ends cleanly
    await loading;
  });
});

describe("ScControl.setValue", () => {
  it("writes the store, syncs its live _state, and sends exactly one /n_set", async () => {
    const { host } = await mountExample();
    const freq = control(host, "freq");
    const synth = host.querySelector("sc-synth") as ScSynth;

    freq.setValue(550);
    expect(appStore.get().runtime[host.id]["s1.freq"]).toBe(550);
    expect(freq._state).toBe(550);
    expect(freq.value).toBe(440); // the declarative attribute mirror never moves
    expect(nSets()).toHaveLength(1);
    expect(nSets()[0].args).toEqual([synth.nodeId, "freq", 550]);
  });

  it("is idempotent — re-setting the current value sends nothing", async () => {
    const { host } = await mountExample();
    control(host, "freq").setValue(440); // the seeded default
    expect(nSets()).toHaveLength(0);
  });

  it("a direct store write is UI-only: statechange fires, views refresh, no /n_set", async () => {
    const { host } = await mountExample();
    const freq = control(host, "freq");
    const range = inputByBind(host, "s1.freq");
    const seen: number[] = [];
    const off = freq.onStateChange((v) => seen.push(v));

    setRuntimeValue(host.id, "s1.freq", 660);
    await range.updateComplete;
    expect(freq._state).toBe(660);
    expect(seen).toEqual([660]);
    expect(widgetOf(range).value).toBe(660);
    expect(nSets()).toHaveLength(0); // the no-echo invariant

    off(); // the unregister works — further writes notify nobody
    setRuntimeValue(host.id, "s1.freq", 670);
    expect(seen).toEqual([660]);
  });
});

describe("inputs and display", () => {
  it("range input events flow store → /n_set → sibling display", async () => {
    const { host } = await mountExample();
    const synth = host.querySelector("sc-synth") as ScSynth;
    // The first range binds s1.freq; its sibling display formats "%d Hz".
    const range = inputByBind(host, "s1.freq");
    const display = host.querySelector('sc-display[bind="s1.freq"]') as ScDisplay;

    dragWidget(range, 880);

    expect(appStore.get().runtime[host.id]["s1.freq"]).toBe(880);
    expect(nSets()).toHaveLength(1);
    expect(nSets()[0].args).toEqual([synth.nodeId, "freq", 880]);
    await display.updateComplete;
    expect(display.textContent).toBe("880 Hz");
  });

  it("checkbox maps checked to 1/0 and follows external store writes", async () => {
    const { host } = await mountExample();
    const synth = host.querySelector("sc-synth") as ScSynth;
    const checkbox = host.querySelector("sc-checkbox") as ScElement & {
      updateComplete: Promise<boolean>;
    };
    expect(toggleOf(checkbox).checked).toBe(false); // seeded default 0

    toggleWidget(checkbox, true);
    expect(appStore.get().runtime[host.id]["s1.mute"]).toBe(1);
    expect(nSets()[0].args).toEqual([synth.nodeId, "mute", 1]);

    setRuntimeValue(host.id, "s1.mute", 0);
    await checkbox.updateComplete;
    expect(toggleOf(checkbox).checked).toBe(false);
    expect(nSets()).toHaveLength(1); // the external write sent no OSC
  });

  it("displays render the seeded defaults through their format", async () => {
    const { host } = await mountExample();
    const displays = [...host.querySelectorAll("sc-display")] as ScDisplay[];
    await Promise.all(displays.map((d) => d.updateComplete));
    const texts = displays.map((d) => d.textContent);
    expect(texts).toContain("440 Hz"); // %d Hz over 440
    expect(texts).toContain("0.20"); // %.2f over 0.2
  });
});

describe("unmount", () => {
  it("drops the plugin's store map and every subscription", async () => {
    const { host } = await mountExample();
    const freq = control(host, "freq");
    const slider = widgetOf(inputByBind(host, "s1.freq"));

    host.remove();
    expect(appStore.get().runtime[host.id]).toBeUndefined();

    // A write straight into the slice reaches no detached element.
    setRuntimeValue(host.id, "s1.freq", 999);
    expect(freq._state).toBe(440);
    expect(slider.value).toBe(440);
    expect(nSets()).toHaveLength(0);
  });

  it("frees the plugin group wholesale, with no per-synth /n_free", async () => {
    const { host } = await mountExample();
    const groupId = host.nodeId;
    host.remove();
    const after = sent.slice(3).map((m) => [m.address, ...m.args.slice(0, 1)]);
    expect(after).toContainEqual(["/d_free", "sine"]);
    expect(after).toContainEqual(["/g_freeAll", groupId]);
    expect(after).toContainEqual(["/n_free", groupId]);
    expect(after.filter(([a]) => a === "/n_free")).toHaveLength(1);
  });

  it("a parse-only host removes cleanly", () => {
    const { host } = parseExample();
    expect(() => host.remove()).not.toThrow();
  });
});

describe("disconnect / reconnect", () => {
  it("a connection drop unloads every element; reconnect reloads with the user's values", async () => {
    setConnected(true); // established connection — set before mounting (change-only signal)
    const { host } = await mountExample();
    const synth = host.querySelector("sc-synth") as ScSynth;
    const def = host.querySelector("sc-synthdef") as ScSynthDef;
    const firstSynthId = synth.nodeId;
    control(host, "freq").setValue(880);

    sent.length = 0;
    oscClient.close(); // → connected=false → unload (and waiter rejection, like a real drop)

    expect(host.loaded).toBe(false);
    expect(host.nodeId).toBe(0);
    expect(synth.loaded).toBe(false);
    expect(synth.nodeId).toBe(0);
    expect(def.loaded).toBe(false);
    // Teardown attempted, children before the group (the live client drops
    // these on a dead socket; the mock records them).
    expect(sent.map((m) => m.address)).toEqual(["/d_free", "/g_freeAll", "/n_free"]);
    // The runtime map survives a disconnect — only unmount drops it.
    expect(appStore.get().runtime[host.id]["s1.freq"]).toBe(880);

    sent.length = 0;
    setConnected(true); // reconnect
    await vi.waitFor(() => expect(host.loaded).toBe(true));
    expect(sent.map((m) => m.address)).toEqual(["/g_new", "/d_recv", "/s_new"]);
    // Fresh node ids from the new block; the /s_new bakes in the moved value.
    expect(synth.nodeId).not.toBe(firstSynthId);
    expect(sent[2].args).toEqual([
      "sine",
      synth.nodeId,
      1,
      host.nodeId,
      "freq",
      880,
      "amp",
      0.2,
      "pan",
      0,
      "mute",
      0,
    ]);

    // The store wiring was rebuilt, not duplicated: an external write still
    // refreshes the input through the fresh subscription.
    const range = inputByBind(host, "s1.freq");
    setRuntimeValue(host.id, "s1.freq", 700);
    await range.updateComplete;
    expect(widgetOf(range).value).toBe(700);
  });

  it("recovers from a mid-load disconnect once the connection returns", async () => {
    setConnected(true);
    // Withhold the /synced ack so the first pass stalls at /d_recv.
    send.mockImplementation((packet) => {
      const msg = packet as OSC.Message;
      sent.push(msg);
      if (msg.address !== "/d_recv") autoRespond(msg);
    });
    const { host } = parseExample();
    const loading = host.load().catch(() => {});
    await new Promise((r) => setTimeout(r, 0));
    expect(host.loaded).toBe(true); // group is up, def stalled

    oscClient.close(); // rejects the pending waiter AND unloads the partial state
    await loading;
    expect(host.loaded).toBe(false);
    expect(host.nodeId).toBe(0);

    // Reconnect against a fully answering server: exactly one clean pass.
    send.mockImplementation((packet) => {
      const msg = packet as OSC.Message;
      sent.push(msg);
      autoRespond(msg);
    });
    sent.length = 0;
    setConnected(true);
    await vi.waitFor(() => expect(host.loaded).toBe(true));
    expect(sent.map((m) => m.address)).toEqual(["/g_new", "/d_recv", "/s_new"]);
    expect(sent.filter((m) => m.address === "/s_new")).toHaveLength(1);
  });
});

describe("state propagation (vars + bound state)", () => {
  const VAR_XML = wrapXml(`
    <sc-group name="vars">
      <sc-var name="a" value="0.5"/>
      <sc-var name="b" value="0"/>
      <sc-var name="mirror" bind="vars.a"/>
      <sc-var name="doubled" bind="vars.a * 2"/>
      <sc-var name="sum" bind="vars.a + vars.b"/>
      <sc-var name="ratio" bind="vars.a / vars.b"/>
    </sc-group>
    <sc-slider bind="vars.a" min="0" max="1" step="0.01"/>
    <sc-display bind="vars.doubled" format="%.2f"/>
  `);

  const mountVars = () => mountPlugin(VAR_XML);
  const varByName = (host: ScPlugin, name: string) =>
    [...host.querySelectorAll("sc-var")].find((v) => (v as ScVar).name === name) as ScVar;

  it("literal vars seed their store keys; bound vars settle off-store in _state", async () => {
    const { host } = await mountVars();
    // Only LITERAL state is store-backed — derived values live on the elements.
    expect(appStore.get().runtime[host.id]).toEqual({
      "vars.a": 0.5,
      "vars.b": 0,
    });
    expect(varByName(host, "mirror")._state).toBe(0.5);
    expect(varByName(host, "doubled")._state).toBe(1);
    expect(varByName(host, "sum")._state).toBe(0.5);
    expect(varByName(host, "ratio")._state).toBe(0); // division by zero guards to 0
    // Vars never touch scsynth — the only send is the plugin group's /g_new.
    expect(sent.map((m) => m.address)).toEqual(["/g_new"]);
  });

  it("an input writes a var and the bound chain cascades, without OSC", async () => {
    const { host } = await mountVars();
    const display = host.querySelector("sc-display") as ScDisplay;

    dragWidget(host.querySelector("sc-slider")!, 0.8);

    expect(appStore.get().runtime[host.id]["vars.a"]).toBe(0.8); // the literal key
    expect(varByName(host, "mirror")._state).toBe(0.8);
    expect(varByName(host, "doubled")._state).toBe(1.6);
    expect(varByName(host, "sum")._state).toBe(0.8);
    expect(nSets()).toHaveLength(0);
    await display.updateComplete;
    expect(display.textContent).toBe("1.60");
  });

  it("bound state is read-only, and a converged recompute notifies nobody", async () => {
    const { host } = await mountVars();
    const before = appStore.get().runtime;
    const seen: number[] = [];
    varByName(host, "sum").onStateChange((v) => seen.push(v));

    varByName(host, "mirror").setValue(9); // derived — silently inert
    varByName(host, "a").setValue(0.5); // already the current value
    expect(appStore.get().runtime).toBe(before); // same reference: zero writes
    expect(seen).toEqual([]); // no statechange on unchanged recomputes

    varByName(host, "b").setValue(0.25); // a real move: exactly one notification
    expect(seen).toEqual([0.75]);
    expect(varByName(host, "mirror")._state).toBe(0.5); // untouched by the earlier write
  });

  it("a gesture on a derived-bound input snaps the widget back", async () => {
    // Regression: the inert-write re-read reassigns an UNCHANGED reactive
    // value, which Lit alone would not re-render — the input must force the
    // update so live() actually restores the widget.
    const SNAP_XML = wrapXml(`
      <sc-group name="vars">
        <sc-var name="a" value="0"/>
        <sc-var name="doubled" bind="vars.a * 2"/>
      </sc-group>
      <sc-slider bind="vars.doubled" min="0" max="4" step="0.01"/>
      <sc-checkbox bind="vars.doubled"/>
    `);
    const { host } = await mountPlugin(SNAP_XML);
    const range = host.querySelector("sc-slider") as ScElement & {
      updateComplete: Promise<boolean>;
    };
    const box = host.querySelector("sc-checkbox") as ScElement & {
      updateComplete: Promise<boolean>;
    };

    dragWidget(range, 3.5); // the user drags — the write to derived state is inert
    await range.updateComplete;
    expect(widgetOf(range).value).toBe(0); // snapped back to the real value

    toggleWidget(box, true); // the user clicks — equally inert
    await box.updateComplete;
    expect(toggleOf(box).checked).toBe(false); // snapped back
  });

  it("statechange does not bubble to ancestor elements", async () => {
    const { host } = await mountVars();
    const group = host.querySelector("sc-group")!;
    const leaked: Event[] = [];
    group.addEventListener("statechange", (e) => leaked.push(e));

    varByName(host, "a").setValue(0.9); // notifies a's own listeners + dependents
    expect(leaked).toEqual([]);
  });

  it("a reload keeps the user-moved literal value and rebuilds the propagation", async () => {
    const { host } = await mountVars();
    varByName(host, "a").setValue(0.25);

    host.unload();
    await host.load();

    expect(appStore.get().runtime[host.id]["vars.a"]).toBe(0.25);
    varByName(host, "a").setValue(0.1);
    expect(varByName(host, "doubled")._state).toBe(0.2); // one fresh subscription
  });
});

describe("bound enabled control on a synth", () => {
  const BOUND_XML = wrapXml(`
    <sc-group name="vars">
      <sc-var name="master" value="200"/>
    </sc-group>
    <sc-synthdef name="sine">
      <sc-control name="freq" value="440"/>
      <sc-ugen name="osc" type="SinOsc">
        <sc-control name="freq" bind="freq"/>
      </sc-ugen>
      <sc-ugen name="out" type="Out">
        <sc-control name="bus" value="0"/>
        <sc-control name="channelsarray" bind="osc"/>
      </sc-ugen>
    </sc-synthdef>
    <sc-synth name="s1" bind="sine">
      <sc-control name="freq" bind="vars.master * 2"/>
    </sc-synth>
  `);

  const master = (host: ScPlugin) => host.querySelector("sc-var") as ScVar;

  it("/s_new bakes the computed initial; a source change sends exactly one recomputed /n_set", async () => {
    const { host } = await mountPlugin(BOUND_XML);
    const synth = host.querySelector("sc-synth") as ScSynth;
    const sNew = sent.find((m) => m.address === "/s_new")!;
    expect(sNew.args).toEqual(["sine", synth.nodeId, 1, host.nodeId, "freq", 400]);

    master(host).setValue(300);
    const freq = host.querySelector("sc-synth sc-control") as ScControl;
    expect(freq._state).toBe(600); // derived — no store key, the element holds it
    expect(appStore.get().runtime[host.id]["s1.freq"]).toBeUndefined();
    expect(nSets()).toHaveLength(1);
    expect(nSets()[0].args).toEqual([synth.nodeId, "freq", 600]);

    master(host).setValue(300); // unchanged — nothing new
    expect(nSets()).toHaveLength(1);
  });

  it("a write landing in the /s_new ack window is caught up after the ack", async () => {
    let pendingSNew: OSC.Message | undefined;
    send.mockImplementation((packet) => {
      const msg = packet as OSC.Message;
      sent.push(msg);
      if (msg.address === "/s_new")
        pendingSNew = msg; // withhold the /n_go
      else autoRespond(msg);
    });

    const { host } = parsePlugin(BOUND_XML);
    const loading = host.load();
    await vi.waitFor(() => expect(pendingSNew).toBeDefined());
    // The element's nodeId is assigned only once /n_go lands — the allocated
    // id rides the withheld /s_new itself.
    const nodeId = pendingSNew!.args[1] as number;
    expect(pendingSNew!.args).toEqual(["sine", nodeId, 1, host.nodeId, "freq", 400]);

    // Drift while the ack is pending: store moves, no /n_set (node not live).
    master(host).setValue(400);
    expect(nSets()).toHaveLength(0);

    oscClient.handleReply(new OSC.Message("/n_go", nodeId, 1, -1, -1, 0));
    await loading;
    expect(nSets()).toHaveLength(1); // the catch-up diff
    expect(nSets()[0].args).toEqual([nodeId, "freq", 800]);
  });
});

describe("sc-if", () => {
  const IF_XML = wrapXml(`
    <sc-var name="gate" value="1"/>
    <sc-var name="freq" value="440"/>
    <sc-if bind="gate"><p>on</p></sc-if>
    <sc-if bind="gate == 0"><p>off</p></sc-if>
    <sc-if bind="freq > 440"><p>high</p></sc-if>
    <sc-checkbox bind="gate"/>
  `);

  const mountIf = async () => {
    const { host } = await mountPlugin(IF_XML);
    const ifs = [...host.querySelectorAll("sc-if")] as Array<
      ScElement & { updateComplete: Promise<boolean> }
    >;
    await Promise.all(ifs.map((el) => el.updateComplete));
    return { host, ifs };
  };
  const hiddenStates = (ifs: Element[]) => ifs.map((el) => el.hasAttribute("hidden"));
  const varByName = (host: ScPlugin, name: string) =>
    [...host.querySelectorAll("sc-var")].find((v) => (v as ScVar).name === name) as ScVar;

  it("shows children on the truthiness of the expression bind", async () => {
    const { ifs } = await mountIf();
    expect(hiddenStates(ifs)).toEqual([false, true, true]); // gate=1, gate==0 → 0, freq>440 → 0
  });

  it("flipping the gate through a checkbox swaps the sections live", async () => {
    const { host, ifs } = await mountIf();

    toggleWidget(host.querySelector("sc-checkbox")!, false);
    await Promise.all(ifs.map((el) => el.updateComplete));
    expect(hiddenStates(ifs)).toEqual([true, false, true]);
  });

  it("comparison expressions follow the live value", async () => {
    const { host, ifs } = await mountIf();
    varByName(host, "freq").setValue(880);
    await ifs[2].updateComplete;
    expect(ifs[2].hasAttribute("hidden")).toBe(false); // freq > 440
    expect(ifs[0].hasAttribute("hidden")).toBe(false); // gate untouched
  });

  it("unload drops the subscription — later store writes don't re-toggle", async () => {
    const { host, ifs } = await mountIf();
    host.unload();
    setRuntimeValue(host.id, "gate", 0);
    await Promise.all(ifs.map((el) => el.updateComplete));
    expect(hiddenStates(ifs)).toEqual([false, true, true]); // frozen pre-unload state
  });
});

describe("selection inputs (select + radio-group)", () => {
  // Two inputs on one var: the select and the radio-group both bind vars.mode,
  // so choosing on one cascades to the other through the shared _state.
  const CHOICE_XML = wrapXml(`
    <sc-group name="vars">
      <sc-var name="mode" value="1"/>
    </sc-group>
    <sc-select bind="vars.mode">
      <sc-option value="0" label="Off"/>
      <sc-option value="1" label="On"/>
      <sc-option value="2" label="Auto"/>
    </sc-select>
    <sc-radio-group bind="vars.mode">
      <sc-radio value="0" label="Off"/>
      <sc-radio value="1" label="On"/>
      <sc-radio value="2" label="Auto"/>
    </sc-radio-group>
  `);
  const mountChoice = () => mountPlugin(CHOICE_XML);
  const select = (host: ScPlugin) =>
    host.querySelector("sc-select") as ScElement & { updateComplete: Promise<boolean> };
  const radioGroup = (host: ScPlugin) =>
    host.querySelector("sc-radio-group") as ScElement & { updateComplete: Promise<boolean> };

  it("collects the option/radio children into projected base widgets", async () => {
    const { host } = await mountChoice();
    expect(choiceOf(select(host))?.querySelectorAll("sc-base-option")).toHaveLength(3);
    expect(choiceOf(radioGroup(host))?.querySelectorAll("sc-base-radio")).toHaveLength(3);
  });

  it("syncs the selection from the bound var's seeded value", async () => {
    const { host } = await mountChoice();
    expect(choiceOf(select(host)).value).toBe(1);
    expect(choiceOf(radioGroup(host)).value).toBe(1);
  });

  it("choosing on the select writes the var and cascades to the radio-group", async () => {
    const { host } = await mountChoice();
    chooseWidget(select(host), 2);
    expect(appStore.get().runtime[host.id]["vars.mode"]).toBe(2);
    expect(nSets()).toHaveLength(0); // vars never touch scsynth
    await radioGroup(host).updateComplete;
    expect(choiceOf(radioGroup(host)).value).toBe(2);
  });

  it("choosing on the radio-group writes the var and cascades to the select", async () => {
    const { host } = await mountChoice();
    chooseWidget(radioGroup(host), 0);
    expect(appStore.get().runtime[host.id]["vars.mode"]).toBe(0);
    await select(host).updateComplete;
    expect(choiceOf(select(host)).value).toBe(0);
  });
});

describe("formatValue", () => {
  it("covers the printf cases", () => {
    expect(formatValue("%d Hz", 439.6)).toBe("440 Hz");
    expect(formatValue("%.2f", 0.2)).toBe("0.20");
    expect(formatValue("%f", 1.5)).toBe("1.5");
    expect(formatValue("%s!", "hi")).toBe("hi!");
    expect(formatValue("%b", true)).toBe("true");
    expect(formatValue("plain", 1)).toBe("plain");
    expect(formatValue("%d", undefined)).toBe("");
  });
});
