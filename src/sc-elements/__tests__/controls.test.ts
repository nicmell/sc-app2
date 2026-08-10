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
import { type OscMessage } from "@sc-app/server-commands";
import { oscClient } from "@/lib/osc/OscClient";
import { appStore } from "@/stores/store";
import type { StateValue } from "@/types/runtime";
import {
  registerScElements,
  type ScControl,
  type ScDisplay,
  type ScElement,
  type ScGroup,
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

const oscMessage = (address: string, ...args: OscMessage["args"]): OscMessage => ({
  address,
  args,
});

let sent: OscMessage[];
let send: ReturnType<typeof installScsynthMock>["send"];

const parseExample = () => parsePlugin(xml);
const mountExample = () => mountPlugin(xml);

const control = (host: ScPlugin, key: string) =>
  [...host.querySelectorAll("sc-synth sc-control")].find(
    (c) => (c as ScControl).getProp("name") === key,
  ) as ScControl;

const nSets = () => sent.filter((m) => m.address === "/n_set");

/** The ui-components value widget a sc-slider/sc-knob renders — its value lives
 *  in the base widget's shadow, so tests drive the host (which re-emits a
 *  composed `input`, exactly the event the input listens for). */
type ValueWidget = HTMLElement & { value: number };
const widgetOf = (el: Element) => el.querySelector("sc-base-slider, sc-base-knob") as ValueWidget;
/** The sc-slider/sc-knob wired to a given bind (tag-agnostic — freq is a knob). */
const inputByBind = (host: ScPlugin, bind: string) =>
  host.querySelector(
    `sc-slider[bind\\:value="${bind}"], sc-knob[bind\\:value="${bind}"]`,
  ) as ScElement & {
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
  appStore.update((s) => ({ ...s, osc: { ...s.osc, connected: false } }));
});

/** Drive the `connected` signal the plugins live on (the osc slice). */
const setConnected = (connected: boolean) =>
  appStore.update((s) => ({ ...s, osc: { ...s.osc, connected } }));

const closeTransport = () =>
  (
    oscClient as unknown as { handleTransportEvent(event: { type: "close" }): void }
  ).handleTransportEvent({ type: "close" });

describe("load pass", () => {
  it("seeds exactly the enabled literal controls' defaults, keyed by full path", async () => {
    const { host } = await mountExample();
    expect(host.runtime.get()).toEqual({
      "s1.freq": 440,
      "s1.amp": 0.2,
      "s1.pan": 0,
      "s1.gate": 1,
    });
  });

  it("parse alone stays store-pure (no seeding before load)", () => {
    const { host } = parseExample();
    expect(host.runtime.get()).toEqual({});
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
      "gate",
      1,
    ]);

    expect(host.nodeId).toBe(groupId);
    expect(host.loaded).toBe(true);
  });

  it("never resolves /s_new before the synthdef's /synced ack", async () => {
    // Withhold the /synced ack: the load pass must stall before /s_new.
    send.mockImplementation((packet) => {
      const msg = packet as OscMessage;
      sent.push(msg);
      if (msg.address !== "/d_recv") autoRespond(msg);
    });
    const { host } = parseExample();
    document.body.appendChild(host);
    await host.updateComplete;
    let settled = false;
    const loading = host
      .load()
      .catch(() => {})
      .finally(() => (settled = true));
    await new Promise((r) => setTimeout(r, 10));
    expect(settled).toBe(false);
    expect(sent.map((m) => m.address)).toEqual(["/g_new", "/d_recv"]);
    closeTransport(); // reject the pending waiter so the test ends cleanly
    await loading;
  });
});

describe("ScControl.setValue", () => {
  it("writes the store, syncs its live _state, and sends exactly one /n_set", async () => {
    const { host } = await mountExample();
    const freq = control(host, "freq");
    const synth = host.querySelector("sc-synth") as ScSynth;

    freq.setValue(550);
    expect(host.runtime.get()["s1.freq"]).toBe(550);
    expect(freq._state).toBe(550);
    expect(freq.getProp("value")).toBe(440); // the declarative attribute mirror never moves
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
    const seen: StateValue[] = [];
    const off = freq.onStateChange((v) => seen.push(v));

    host.runtime.update((s) => ({ ...s, "s1.freq": 660 }));
    await range.updateComplete;
    expect(freq._state).toBe(660);
    expect(seen).toEqual([660]);
    expect(widgetOf(range).value).toBe(660);
    expect(nSets()).toHaveLength(0); // the no-echo invariant

    off(); // the unregister works — further writes notify nobody
    host.runtime.update((s) => ({ ...s, "s1.freq": 670 }));
    expect(seen).toEqual([660]);
  });
});

describe("inputs and display", () => {
  it("omits undefined forwarded attributes so base-component defaults survive", async () => {
    const pairs = [
      ["sc-button", "sc-base-button"],
      ["sc-checkbox", "sc-base-checkbox"],
      ["sc-knob", "sc-base-knob"],
      ["sc-slider", "sc-base-slider"],
      ["sc-select", "sc-base-select"],
      ["sc-radio-group", "sc-base-radio-group"],
      ["sc-switch", "sc-base-switch"],
    ] as const;

    for (const [wrapperTag, baseTag] of pairs) {
      const wrapper = document.createElement(wrapperTag) as ScElement;
      document.body.appendChild(wrapper);
      await wrapper.updateComplete;
      const base = wrapper.querySelector(baseTag) as HTMLElement & {
        updateComplete: Promise<boolean>;
      };
      await base.updateComplete;
      expect(
        Array.from(base.attributes).filter((attribute) => attribute.value === ""),
        `${wrapperTag} forwarded an empty attribute`,
      ).toEqual([]);
    }

    const button = document.querySelector("sc-button sc-base-button")!;
    expect(button.getAttribute("size")).toBe("md");
    expect(button.getAttribute("variant")).toBe("primary");
    expect(button.hasAttribute("label")).toBe(false);
    expect(button.hasAttribute("icon")).toBe(false);

    const slider = document.querySelector("sc-slider sc-base-slider") as HTMLElement & {
      min: number;
      max: number;
      step: number;
      orientation: string;
    };
    expect([slider.min, slider.max, slider.step, slider.orientation]).toEqual([
      0,
      1,
      0.01,
      "horizontal",
    ]);
  });

  it("range input events flow store → /n_set → sibling display", async () => {
    const { host } = await mountExample();
    const synth = host.querySelector("sc-synth") as ScSynth;
    // The first range binds s1.freq; its sibling display formats "%d Hz".
    const range = inputByBind(host, "s1.freq");
    const display = host.querySelector('sc-display[bind\\:value="s1.freq"]') as ScDisplay;

    dragWidget(range, 880);

    expect(host.runtime.get()["s1.freq"]).toBe(880);
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
    expect(toggleOf(checkbox).checked).toBe(true); // seeded default 1

    toggleWidget(checkbox, false);
    expect(host.runtime.get()["s1.gate"]).toBe(0);
    expect(nSets()[0].args).toEqual([synth.nodeId, "gate", 0]);

    host.runtime.update((s) => ({ ...s, "s1.gate": 1 }));
    await checkbox.updateComplete;
    expect(toggleOf(checkbox).checked).toBe(true);
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
  it("drops every subscription; a remount owns a fresh store", async () => {
    const { host } = await mountExample();
    const freq = control(host, "freq");
    const slider = widgetOf(inputByBind(host, "s1.freq"));

    host.remove();

    // A write straight into the old instance's store reaches no detached element.
    host.runtime.update((s) => ({ ...s, "s1.freq": 999 }));
    expect(freq._state).toBe(440);
    expect(slider.value).toBe(440);
    expect(nSets()).toHaveLength(0);

    // A remounted host is a new instance with its own store: fresh defaults.
    const { host: remounted } = await mountExample();
    expect(remounted.runtime).not.toBe(host.runtime);
    expect(remounted.runtime.get()).toEqual({
      "s1.freq": 440,
      "s1.amp": 0.2,
      "s1.pan": 0,
      "s1.gate": 1,
    });
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
  it("does not adopt a plugin group whose /n_go arrives after unload", async () => {
    setConnected(true);
    let pendingGroup: OscMessage | undefined;
    send.mockImplementation((packet) => {
      const msg = packet as OscMessage;
      sent.push(msg);
      if (msg.address === "/g_new") pendingGroup = msg;
      else autoRespond(msg);
    });

    const { host } = parseExample();
    document.body.appendChild(host);
    await host.updateComplete;
    const loading = host.load();
    await vi.waitFor(() => expect(pendingGroup).toBeDefined());
    const staleId = pendingGroup!.args[0] as number;

    setConnected(false);
    autoRespond(pendingGroup!);
    await loading;

    expect(host.loaded).toBe(false);
    expect(host.nodeId).toBe(0);
    expect(sent.map((m) => [m.address, m.args[0]])).toContainEqual(["/n_free", staleId]);
  });

  it("does not mark a synthdef loaded when /synced arrives after unload", async () => {
    setConnected(true);
    let pendingDef: OscMessage | undefined;
    send.mockImplementation((packet) => {
      const msg = packet as OscMessage;
      sent.push(msg);
      if (msg.address === "/d_recv") pendingDef = msg;
      else autoRespond(msg);
    });

    const { host } = parseExample();
    document.body.appendChild(host);
    await host.updateComplete;
    const def = host.querySelector("sc-synthdef") as ScSynthDef;
    const loading = host.load();
    await vi.waitFor(() => expect(pendingDef).toBeDefined());

    setConnected(false);
    autoRespond(pendingDef!);
    await loading;

    expect(def.loaded).toBe(false);
  });

  it("a connection drop unloads every element; reconnect reloads with the user's values", async () => {
    setConnected(true); // established connection — set before mounting (change-only signal)
    const { host } = await mountExample();
    const synth = host.querySelector("sc-synth") as ScSynth;
    const def = host.querySelector("sc-synthdef") as ScSynthDef;
    const firstSynthId = synth.nodeId;
    control(host, "freq").setValue(880);

    sent.length = 0;
    closeTransport(); // → connected=false → unload (and waiter rejection, like a real drop)

    expect(host.loaded).toBe(false);
    expect(host.nodeId).toBe(0);
    expect(synth.loaded).toBe(false);
    expect(synth.nodeId).toBe(0);
    expect(def.loaded).toBe(false);
    // Teardown attempted, children before the group (the live client drops
    // these on a dead socket; the mock records them).
    expect(sent.map((m) => m.address)).toEqual(["/d_free", "/g_freeAll", "/n_free"]);
    // The instance's runtime store survives a disconnect — user values kept.
    expect(host.runtime.get()["s1.freq"]).toBe(880);

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
      "gate",
      1,
    ]);

    // The store wiring was rebuilt, not duplicated: an external write still
    // refreshes the input through the fresh subscription.
    const range = inputByBind(host, "s1.freq");
    host.runtime.update((s) => ({ ...s, "s1.freq": 700 }));
    await range.updateComplete;
    expect(widgetOf(range).value).toBe(700);
  });

  it("recovers from a mid-load disconnect once the connection returns", async () => {
    setConnected(true);
    // Withhold the /synced ack so the first pass stalls at /d_recv.
    send.mockImplementation((packet) => {
      const msg = packet as OscMessage;
      sent.push(msg);
      if (msg.address !== "/d_recv") autoRespond(msg);
    });
    const { host } = parseExample();
    document.body.appendChild(host);
    await host.updateComplete;
    const loading = host.load().catch(() => {});
    await new Promise((r) => setTimeout(r, 0));
    expect(host.loaded).toBe(true); // group is up, def stalled

    closeTransport(); // rejects the pending waiter AND unloads the partial state
    await loading;
    expect(host.loaded).toBe(false);
    expect(host.nodeId).toBe(0);

    // Reconnect against a fully answering server: exactly one clean pass.
    send.mockImplementation((packet) => {
      const msg = packet as OscMessage;
      sent.push(msg);
      autoRespond(msg);
    });
    sent.length = 0;
    setConnected(true);
    await vi.waitFor(() => expect(host.loaded).toBe(true));
    expect(sent.map((m) => m.address)).toEqual(["/g_new", "/d_recv", "/s_new"]);
    expect(sent.filter((m) => m.address === "/s_new")).toHaveLength(1);
  });

  it("does not adopt a synth id from a load invalidated during the /n_go wait", async () => {
    setConnected(true);
    let pendingSNew: OscMessage | undefined;
    send.mockImplementation((packet) => {
      const msg = packet as OscMessage;
      sent.push(msg);
      if (msg.address === "/s_new") pendingSNew = msg;
      else autoRespond(msg);
    });

    const { host } = parseExample();
    document.body.appendChild(host);
    await host.updateComplete;
    const synth = host.querySelector("sc-synth") as ScSynth;
    const firstLoad = host.load();
    await vi.waitFor(() => expect(pendingSNew).toBeDefined());
    const staleId = pendingSNew!.args[1] as number;

    // Invalidate without closing the mock transport, then deliver the late
    // ack. The old pass resolves but must not resurrect the stale synth.
    setConnected(false);
    oscClient.handleReply(oscMessage("/n_go", staleId, 1, -1, -1, 0));
    await firstLoad;
    expect(synth.loaded).toBe(false);
    expect(synth.nodeId).toBe(0);

    send.mockImplementation((packet) => {
      const msg = packet as OscMessage;
      sent.push(msg);
      autoRespond(msg);
    });
    setConnected(true);
    await vi.waitFor(() => expect(synth.loaded).toBe(true));
    expect(synth.nodeId).not.toBe(staleId);
  });
});

describe("state propagation (vars + bound state)", () => {
  const VAR_XML = wrapXml(`
    <sc-group name="vars">
      <sc-var name="a" value="0.5"/>
      <sc-var name="b" value="0"/>
      <sc-var name="mirror" bind:value="vars.a"/>
      <sc-var name="doubled" bind:value="vars.a * 2"/>
      <sc-var name="sum" bind:value="vars.a + vars.b"/>
      <sc-var name="ratio" bind:value="vars.a / vars.b"/>
    </sc-group>
    <sc-slider bind:value="vars.a" min="0" max="1" step="0.01"/>
    <sc-display bind:value="vars.doubled" format="%.2f"/>
  `);

  const mountVars = () => mountPlugin(VAR_XML);
  const varByName = (host: ScPlugin, name: string) =>
    [...host.querySelectorAll("sc-var")].find(
      (v) => (v as ScVar).getProp("name") === name,
    ) as ScVar;

  it("literal vars seed their store keys; bound vars settle off-store in _state", async () => {
    const { host } = await mountVars();
    // Only LITERAL state is store-backed — derived values live on the elements.
    expect(host.runtime.get()).toEqual({
      "vars.a": 0.5,
      "vars.b": 0,
    });
    expect(varByName(host, "mirror")._state).toBe(0.5);
    expect(varByName(host, "doubled")._state).toBe(1);
    expect(varByName(host, "sum")._state).toBe(0.5);
    expect(varByName(host, "ratio")._state).toBe(0); // division by zero guards to 0
    // Vars never touch scsynth — the only sends are the plugin group's
    // /g_new and the "vars" sc-group's own /g_new (functional now).
    expect(sent.map((m) => m.address)).toEqual(["/g_new", "/g_new"]);
  });

  it("an input writes a var and the bound chain cascades, without OSC", async () => {
    const { host } = await mountVars();
    const display = host.querySelector("sc-display") as ScDisplay;

    dragWidget(host.querySelector("sc-slider")!, 0.8);

    expect(host.runtime.get()["vars.a"]).toBe(0.8); // the literal key
    expect(varByName(host, "mirror")._state).toBe(0.8);
    expect(varByName(host, "doubled")._state).toBe(1.6);
    expect(varByName(host, "sum")._state).toBe(0.8);
    expect(nSets()).toHaveLength(0);
    await display.updateComplete;
    expect(display.textContent).toBe("1.60");
  });

  it("bound state is read-only, and a converged recompute notifies nobody", async () => {
    const { host } = await mountVars();
    const before = host.runtime.get();
    const seen: StateValue[] = [];
    varByName(host, "sum").onStateChange((v) => seen.push(v));

    varByName(host, "mirror").setValue(9); // derived — silently inert
    varByName(host, "a").setValue(0.5); // already the current value
    expect(host.runtime.get()).toBe(before); // same reference: zero writes
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
        <sc-var name="doubled" bind:value="vars.a * 2"/>
      </sc-group>
      <sc-slider bind:value="vars.doubled" min="0" max="4" step="0.01"/>
      <sc-checkbox bind:value="vars.doubled"/>
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

    expect(host.runtime.get()["vars.a"]).toBe(0.25);
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
        <sc-control name="freq" bind:value="freq"/>
      </sc-ugen>
      <sc-ugen name="out" type="Out">
        <sc-control name="bus" value="0"/>
        <sc-control name="channelsarray" bind:value="osc"/>
      </sc-ugen>
    </sc-synthdef>
    <sc-synth name="s1" synthdef="sine">
      <sc-control name="freq" bind:value="vars.master * 2"/>
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
    expect(host.runtime.get()["s1.freq"]).toBeUndefined();
    expect(nSets()).toHaveLength(1);
    expect(nSets()[0].args).toEqual([synth.nodeId, "freq", 600]);

    master(host).setValue(300); // unchanged — nothing new
    expect(nSets()).toHaveLength(1);
  });

  it("a write landing in the /s_new ack window is caught up after the ack", async () => {
    let pendingSNew: OscMessage | undefined;
    send.mockImplementation((packet) => {
      const msg = packet as OscMessage;
      sent.push(msg);
      if (msg.address === "/s_new")
        pendingSNew = msg; // withhold the /n_go
      else autoRespond(msg);
    });

    const { host } = parsePlugin(BOUND_XML);
    document.body.appendChild(host);
    await host.updateComplete;
    const loading = host.load();
    await vi.waitFor(() => expect(pendingSNew).toBeDefined());
    // The element's nodeId is assigned only once /n_go lands — the allocated
    // id rides the withheld /s_new itself.
    const nodeId = pendingSNew!.args[1] as number;
    expect(pendingSNew!.args).toEqual(["sine", nodeId, 1, host.nodeId, "freq", 400]);

    // Drift while the ack is pending: store moves, no /n_set (node not live).
    master(host).setValue(400);
    expect(nSets()).toHaveLength(0);

    oscClient.handleReply(oscMessage("/n_go", nodeId, 1, -1, -1, 0));
    await loading;
    expect(nSets()).toHaveLength(1); // the catch-up diff
    expect(nSets()[0].args).toEqual([nodeId, "freq", 800]);
  });
});

describe("sc-if", () => {
  const IF_XML = wrapXml(`
    <sc-var name="gate" value="1"/>
    <sc-var name="freq" value="440"/>
    <sc-if bind:when="gate"><p>on</p></sc-if>
    <sc-if bind:when="gate == 0"><p>off</p></sc-if>
    <sc-if bind:when="freq > 440"><p>high</p></sc-if>
    <sc-checkbox bind:value="gate"/>
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
    [...host.querySelectorAll("sc-var")].find(
      (v) => (v as ScVar).getProp("name") === name,
    ) as ScVar;

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
    host.runtime.update((s) => ({ ...s, gate: 0 }));
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
    <sc-select bind:value="vars.mode">
      <sc-option value="0" label="Off"/>
      <sc-option value="1" label="On"/>
      <sc-option value="2" label="Auto"/>
    </sc-select>
    <sc-radio-group bind:value="vars.mode">
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
    expect(host.runtime.get()["vars.mode"]).toBe(2);
    expect(nSets()).toHaveLength(0); // vars never touch scsynth
    await radioGroup(host).updateComplete;
    expect(choiceOf(radioGroup(host)).value).toBe(2);
  });

  it("choosing on the radio-group writes the var and cascades to the select", async () => {
    const { host } = await mountChoice();
    chooseWidget(radioGroup(host), 0);
    expect(host.runtime.get()["vars.mode"]).toBe(0);
    await select(host).updateComplete;
    expect(choiceOf(select(host)).value).toBe(0);
  });
});

describe("name syntax (requireName)", () => {
  const NAME_ERROR = (tag: string, name: string) =>
    `<${tag}>: "name" attribute must be a plain identifier — letters, digits, "_", "-" (got "${name}")`;

  it("rejects dotted names — they would forge another scope's store key", () => {
    // "s1.freq" as a NAME would alias the freq control of a synth named s1.
    expect(() => parsePlugin(wrapXml(`<sc-var name="s1.freq" value="1"/>`))).toThrow(
      NAME_ERROR("sc-var", "s1.freq"),
    );
    expect(() =>
      parsePlugin(wrapXml(`<sc-group name="a.b"><sc-control name="x" value="0"/></sc-group>`)),
    ).toThrow(NAME_ERROR("sc-group", "a.b"));
  });

  it("rejects names that no bind could ever reference", () => {
    expect(() => parsePlugin(wrapXml(`<sc-var name="1st" value="0"/>`))).toThrow(
      NAME_ERROR("sc-var", "1st"),
    );
    expect(() => parsePlugin(wrapXml(`<sc-var name="a b" value="0"/>`))).toThrow(
      NAME_ERROR("sc-var", "a b"),
    );
    expect(() => parsePlugin(wrapXml(`<sc-var name="a-" value="0"/>`))).toThrow(
      NAME_ERROR("sc-var", "a-"),
    );
  });

  it("accepts hyphenated identifier words (the addressable name grammar)", () => {
    expect(() => parsePlugin(wrapXml(`<sc-var name="mod-freq_2" value="0"/>`))).not.toThrow();
  });
});

describe("sc-if transparency", () => {
  // The var lives INSIDE the sc-if (through a div) but belongs to the
  // enclosing level: root-scoped, root-pathed, referenceable from a LATER
  // outer sibling — only its visibility follows the sc-if.
  const TRANSPARENT_XML = wrapXml(`
    <sc-var name="gate" value="1"/>
    <sc-if bind:when="gate">
      <div>
        <sc-var name="mirror" bind:value="gate * 2"/>
      </div>
    </sc-if>
    <sc-display bind:value="mirror" format="%d"/>
  `);

  it("contents key at the enclosing path and are referenceable from outside", async () => {
    const { host } = await mountPlugin(TRANSPARENT_XML);
    const scIf = host.querySelector("sc-if") as ScElement;
    const mirror = [...host.querySelectorAll("sc-var")].find(
      (v) => (v as ScVar).getProp("name") === "mirror",
    ) as ScVar;
    const display = host.querySelector("sc-display") as ScDisplay;

    expect(host.runtime.get()).toEqual({ gate: 1 }); // literal only, root path
    expect(mirror._state).toBe(2);
    // The tree stays truthful; the OWNER is recovered through transparency.
    expect(mirror._parentScNode).toBe(scIf);
    expect(mirror.namedScParent).toBe(host);
    expect(scIf._scChildren).toContain(mirror);
    await display.updateComplete;
    expect(display.textContent).toBe("2");
  });

  it("a same-named element inside the sc-if collides with the enclosing scope", () => {
    const XML = wrapXml(`
      <sc-var name="x" value="1"/>
      <sc-if bind:when="x"><div><sc-var name="x" value="2"/></div></sc-if>
    `);
    expect(() => parsePlugin(XML)).toThrow('<sc-var name="x">: duplicate name in scope');
  });

  it("the sc-if's own bind cannot reference its own contents (bind order)", () => {
    const XML = wrapXml(`<sc-if bind:when="x"><sc-var name="x" value="1"/></sc-if>`);
    expect(() => parsePlugin(XML)).toThrow('<sc-if>: "x" is referenced before it is declared');
  });

  it("a synth inside a falsy sc-if is hidden but LIVE (/s_new sent)", async () => {
    const XML = wrapXml(`
      <sc-synthdef name="beep">
        <sc-control name="freq" value="440"/>
        <sc-ugen name="osc" type="SinOsc">
          <sc-control name="freq" bind:value="freq"/>
        </sc-ugen>
        <sc-ugen name="out" type="Out">
          <sc-control name="bus" value="0"/>
          <sc-control name="channelsarray" bind:value="osc"/>
        </sc-ugen>
      </sc-synthdef>
      <sc-var name="show" value="0"/>
      <sc-if bind:when="show">
        <sc-synth name="s" synthdef="beep">
          <sc-control name="freq" value="440"/>
        </sc-synth>
      </sc-if>
    `);
    const { host } = await mountPlugin(XML);
    const scIf = host.querySelector("sc-if") as ScElement & {
      updateComplete: Promise<boolean>;
    };
    const synth = host.querySelector("sc-synth") as ScSynth;

    await scIf.updateComplete;
    expect(scIf.hasAttribute("hidden")).toBe(true); // invisible…
    expect(synth.loaded).toBe(true); // …but playing
    expect(sent.filter((m) => m.address === "/s_new")).toHaveLength(1);
  });
});

describe("sc-group", () => {
  const GROUP_XML = wrapXml(`
    <sc-group name="g">
      <sc-control name="vol" value="0.5"/>
      <sc-synthdef name="sine">
        <sc-control name="freq" value="440"/>
        <sc-ugen name="osc" type="SinOsc">
          <sc-control name="freq" bind:value="freq"/>
        </sc-ugen>
        <sc-ugen name="out" type="Out">
          <sc-control name="bus" value="0"/>
          <sc-control name="channelsarray" bind:value="osc"/>
        </sc-ugen>
      </sc-synthdef>
      <sc-synth name="s1" synthdef="sine">
        <sc-control name="freq" value="330"/>
      </sc-synth>
      <sc-if bind:when="g.vol">
        <sc-control name="mix" value="0"/>
      </sc-if>
    </sc-group>
  `);

  const group = (host: ScPlugin) => host.querySelector("sc-group") as ScGroup;
  const groupControl = (host: ScPlugin, name: string) =>
    [...host.querySelectorAll("sc-control")].find(
      (c) => (c as ScControl).getProp("name") === name,
    ) as ScControl;

  it("creates its own group under the plugin group; children target it", async () => {
    const { host } = await mountPlugin(GROUP_XML);
    const g = group(host);
    const synth = host.querySelector("sc-synth") as ScSynth;

    expect(sent.map((m) => m.address)).toEqual(["/g_new", "/g_new", "/d_recv", "/s_new"]);
    expect(g.loaded).toBe(true);
    expect(sent[1].args).toEqual([g.nodeId, 1, host.nodeId]); // nested under the plugin group
    expect(sent[3].args[3]).toBe(g.nodeId); // the synth targets the GROUP
    expect(synth.nodeId).not.toBe(g.nodeId);
  });

  it("group-level controls /n_set the group node — including through an sc-if", async () => {
    const { host } = await mountPlugin(GROUP_XML);
    const g = group(host);

    groupControl(host, "vol").setValue(0.8);
    expect(nSets()[0].args).toEqual([g.nodeId, "vol", 0.8]);

    const mix = groupControl(host, "mix"); // declared inside <sc-if> under the group
    expect(mix.enabled).toBe(true);
    expect(host.runtime.get()["g.mix"]).toBe(0); // group-pathed key
    expect(mix.namedScParent).toBe(g);
    mix.setValue(0.3);
    expect(nSets()[1].args).toEqual([g.nodeId, "mix", 0.3]);
  });

  it("nested groups nest their nodes", async () => {
    const XML = wrapXml(`
      <sc-group name="outer">
        <sc-group name="inner">
          <sc-control name="x" value="0"/>
        </sc-group>
      </sc-group>
    `);
    const { host } = await mountPlugin(XML);
    const [outer, inner] = [...host.querySelectorAll("sc-group")] as ScGroup[];
    expect(sent.map((m) => m.address)).toEqual(["/g_new", "/g_new", "/g_new"]);
    expect(sent[1].args).toEqual([outer.nodeId, 1, host.nodeId]);
    expect(sent[2].args).toEqual([inner.nodeId, 1, outer.nodeId]);
  });

  it("unload resets the flags with no per-group frees (the subtree dies with the plugin group)", async () => {
    const { host } = await mountPlugin(GROUP_XML);
    const g = group(host);
    const pluginGroupId = host.nodeId;
    host.remove();
    expect(g.loaded).toBe(false);
    expect(g.nodeId).toBe(0);
    // Exactly the plugin group's wholesale teardown — nothing targets g.
    const frees = sent.filter((m) => m.address === "/g_freeAll" || m.address === "/n_free");
    expect(frees.map((m) => m.args[0])).toEqual([pluginGroupId, pluginGroupId]);
  });

  it("setRunning drives /n_run on live nodes and no-ops on unloaded ones", async () => {
    const { host } = await mountPlugin(GROUP_XML);
    const g = group(host);
    const synth = host.querySelector("sc-synth") as ScSynth;

    g.setRunning(false);
    synth.setRunning(true);
    const runs = sent.filter((m) => m.address === "/n_run");
    expect(runs.map((m) => m.args)).toEqual([
      [g.nodeId, 0],
      [synth.nodeId, 1],
    ]);
    // The load pass itself never sent /n_run (the run attribute is ignored).
    expect(runs).toHaveLength(2);

    host.remove();
    g.setRunning(true); // unloaded — silently inert
    expect(sent.filter((m) => m.address === "/n_run")).toHaveLength(2);
  });
});

describe("runtime props (bind:)", () => {
  const DYN_XML = wrapXml(`
    <sc-var name="lo" value="100"/>
    <sc-var name="hi" value="2000"/>
    <sc-var name="freq" value="440"/>
    <sc-var name="mode" value="lin"/>
    <sc-slider bind:value="freq" bind:min="lo" bind:max="hi" bind:label="'f (' + mode + ')'"/>
    <sc-display bind:value="freq > 1000 ? 'high' : 'low'"/>
  `);
  const varByName = (host: ScPlugin, name: string) =>
    [...host.querySelectorAll("sc-var")].find(
      (v) => (v as ScVar).getProp("name") === name,
    ) as ScVar;
  const slider = (host: ScPlugin) =>
    host.querySelector("sc-slider") as ScElement & { updateComplete: Promise<boolean> };

  it("dynamic widget props evaluate, forward to the base widget, and follow their sources", async () => {
    const { host } = await mountPlugin(DYN_XML);
    const range = slider(host);
    await range.updateComplete;
    expect(widgetOf(range).getAttribute("min")).toBe("100");
    expect(widgetOf(range).getAttribute("max")).toBe("2000");
    expect(widgetOf(range).getAttribute("label")).toBe("f (lin)"); // string concat

    varByName(host, "lo").setValue(50);
    varByName(host, "mode").setValue("exp"); // a STRING store write
    await range.updateComplete;
    expect(widgetOf(range).getAttribute("min")).toBe("50");
    expect(widgetOf(range).getAttribute("label")).toBe("f (exp)");
  });

  it("string ternaries flow to displays and follow the live value", async () => {
    const { host } = await mountPlugin(DYN_XML);
    const display = host.querySelector("sc-display") as ScDisplay;
    await display.updateComplete;
    expect(display.textContent).toBe("low");

    varByName(host, "freq").setValue(1500);
    await display.updateComplete;
    expect(display.textContent).toBe("high");
  });

  it("a reload rebuilds the _attr subscriptions without duplicating them", async () => {
    const { host } = await mountPlugin(DYN_XML);
    host.unload();
    await host.load();
    const range = slider(host);
    varByName(host, "lo").setValue(25);
    await range.updateComplete;
    expect(widgetOf(range).getAttribute("min")).toBe("25"); // one fresh subscription
  });

  it("the static and bind: forms are mutually exclusive (direct validateProps)", () => {
    // happy-dom's XML parser DROPS the later of two attributes whose LOCAL
    // names collide (`value` + `bind:value`) — Chrome keeps both, so the
    // conflict is pinned here on a constructed element (and end-to-end by
    // the bad-runtime-conflict fixture through the CDP harness).
    const el = document.createElement("sc-var") as ScVar;
    el.setAttribute("name", "a");
    el.setAttribute("value", "1");
    el.setAttribute("bind:value", "b");
    expect(() => el.validateProps()).toThrow(
      '<sc-var>: "value" and "bind:value" are mutually exclusive',
    );
  });

  it("a required runtime attr is satisfied by either form — but not by neither", () => {
    expect(() => parsePlugin(wrapXml(`<sc-display value="hello"/>`))).not.toThrow();
    expect(() => parsePlugin(wrapXml(`<sc-display/>`))).toThrow(
      '<sc-display>: missing required "value" attribute',
    );
  });

  it("sc-display renders through the sc-text label wrapper", async () => {
    const { host } = await mountPlugin(wrapXml(`<sc-display value="440" format="%d Hz"/>`));
    const display = host.querySelector("sc-display") as ScDisplay;
    await display.updateComplete;
    const text = display.querySelector("sc-text") as ScElement & {
      updateComplete: Promise<boolean>;
    };
    expect(text.getAttribute("as")).toBe("label");
    await text.updateComplete;
    expect(text.shadowRoot!.querySelector("sc-base-text")!.getAttribute("as")).toBe("label");
    expect(display.textContent).toContain("440 Hz");
  });

  it("visual layout wrappers forward props and stay transparent to binds", async () => {
    const { host } = await mountPlugin(
      wrapXml(`
        <sc-flex orientation="vertical" gap="sm">
          <sc-row align="middle" gutter="md">
            <sc-col span="12" offset="2">
              <sc-var name="freq" value="440"/>
              <sc-text as="label" tone="dim">Freq</sc-text>
            </sc-col>
          </sc-row>
        </sc-flex>
        <sc-display bind:value="freq" format="%d Hz"/>
      `),
    );
    const flex = host.querySelector("sc-flex") as ScElement & { updateComplete: Promise<boolean> };
    const row = host.querySelector("sc-row") as ScElement & { updateComplete: Promise<boolean> };
    const col = host.querySelector("sc-col") as ScElement & { updateComplete: Promise<boolean> };
    const text = host.querySelector("sc-text") as ScElement & { updateComplete: Promise<boolean> };
    const display = host.querySelector("sc-display") as ScDisplay;

    await Promise.all([
      flex.updateComplete,
      row.updateComplete,
      col.updateComplete,
      text.updateComplete,
      display.updateComplete,
    ]);

    const baseFlex = flex.shadowRoot!.querySelector("sc-base-flex")!;
    const baseCol = col.shadowRoot!.querySelector("sc-base-col")!;
    const baseText = text.shadowRoot!.querySelector("sc-base-text")!;

    expect(baseFlex.getAttribute("orientation")).toBe("vertical");
    expect(baseFlex.getAttribute("gap")).toBe("sm");
    const baseRow = row.shadowRoot!.querySelector("sc-base-row")!;
    expect(baseRow).not.toBeNull();
    expect(baseRow.querySelector("slot")).not.toBeNull();
    expect(baseRow.getAttribute("align")).toBe("middle");
    expect(baseRow.getAttribute("gutter")).toBe("md");
    expect(col.getAttribute("span")).toBe("12");
    expect(col.getAttribute("offset")).toBe("2");
    expect(col.getAttribute("style")).toBeNull();
    expect(baseCol.attributes).toHaveLength(0);
    expect(baseCol.querySelector("slot")).not.toBeNull();
    expect(baseText.getAttribute("as")).toBe("label");
    expect(baseText.getAttribute("tone")).toBe("dim");
    expect(display.textContent).toContain("440 Hz");
  });

  it("sc-col sizes its slotted host and uses sc-base-col for its content box", async () => {
    const { host } = await mountPlugin(
      wrapXml(`
        <sc-row>
          <sc-col span="12"><sc-text>left</sc-text></sc-col>
          <sc-col span="12"><sc-text>right</sc-text></sc-col>
        </sc-row>
      `),
    );
    const cols = [...host.querySelectorAll("sc-col")] as Array<
      ScElement & { updateComplete: Promise<boolean> }
    >;
    await Promise.all(cols.map((col) => col.updateComplete));
    const baseCols = cols.map((col) => col.shadowRoot!.querySelector("sc-base-col")!);
    expect(cols.map((col) => col.shadowRoot!.adoptedStyleSheets.length)).toEqual([1, 1]);
    expect(cols.map((col) => col.getAttribute("span"))).toEqual(["12", "12"]);
    expect(cols.map((col) => col.getAttribute("style"))).toEqual([null, null]);
    expect(baseCols.map((col) => col.attributes.length)).toEqual([0, 0]);
  });

  it("keeps sc-col layout attributes structural rather than runtime-bound", () => {
    expect(() =>
      parsePlugin(
        wrapXml(`
          <sc-var name="span" value="12"/>
          <sc-row><sc-col bind:span="span"><sc-text>column</sc-text></sc-col></sc-row>
        `),
      ),
    ).toThrow('<sc-col>: unknown runtime attribute "bind:span"');
  });

  it("rejects bind: forms whose base attribute is unknown", () => {
    const XML = wrapXml(`
      <sc-var name="freq" value="440"/>
      <sc-slider bind:value="freq" bind:foo="freq"/>
    `);
    expect(() => parsePlugin(XML)).toThrow('<sc-slider>: unknown runtime attribute "bind:foo"');
  });

  it("rejects unknown static attributes but accepts the XSD common attributes", () => {
    expect(() =>
      parsePlugin(
        wrapXml(
          `<sc-var name="freq" value="440" id="freq-id" class="control" title="Frequency" style="color: red"/>`,
        ),
      ),
    ).not.toThrow();
    expect(() => parsePlugin(wrapXml(`<sc-var name="freq" value="440" disabeld="true"/>`))).toThrow(
      '<sc-var>: unknown attribute "disabeld"',
    );
  });

  it("enforces the XSD lexical forms for decimal, integer, and boolean attributes", () => {
    for (const value of ["", " ", "1e2"]) {
      expect(() => parsePlugin(wrapXml(`<sc-slider value="${value}"/>`))).toThrow(
        '<sc-slider>: "value" attribute must be a decimal number',
      );
    }
    expect(() => parsePlugin(wrapXml(`<sc-scope channels="1.5"/>`))).toThrow(
      '<sc-scope>: "channels" attribute must be an integer',
    );
    expect(() => parsePlugin(wrapXml(`<sc-checkbox value="0" disabled="flase"/>`))).toThrow(
      '<sc-checkbox>: "disabled" attribute must be one of true|false|1|0 (got "flase")',
    );

    for (const value of ["true", "false", "1", "0"]) {
      expect(() =>
        parsePlugin(wrapXml(`<sc-checkbox value="0" disabled="${value}"/>`)),
      ).not.toThrow();
    }
  });

  it("bind:value inside a ugen is a graph REFERENCE — parses, collects, compiles", () => {
    const XML = wrapXml(`
      <sc-synthdef name="sine">
        <sc-control name="freq" value="440"/>
        <sc-ugen name="osc" type="SinOsc">
          <sc-control name="freq" bind:value="freq"/>
        </sc-ugen>
        <sc-ugen name="out" type="Out">
          <sc-control name="bus" value="0"/>
          <sc-control name="channelsarray" bind:value="osc"/>
        </sc-ugen>
      </sc-synthdef>
    `);
    const { host } = parsePlugin(XML);
    const def = host.querySelector("sc-synthdef") as ScSynthDef;
    expect(def.specs[0].inputs).toEqual({ freq: "freq" });
    expect(def.specs[1].inputs).toEqual({ bus: "0", channelsarray: "osc" });
  });

  it("the exclusion applies to graph inputs too (same generic check)", () => {
    const el = document.createElement("sc-control") as ScControl;
    el.setAttribute("name", "freq");
    el.setAttribute("value", "1");
    el.setAttribute("bind:value", "freq");
    expect(() => el.validateProps()).toThrow(
      '<sc-control>: "value" and "bind:value" are mutually exclusive',
    );
  });

  it("rejects a bind: on a synthdef PARAM (the collector reads static values only)", () => {
    const XML = wrapXml(`
      <sc-synthdef name="sine">
        <sc-control name="freq" bind:value="vars.x"/>
        <sc-ugen name="osc" type="SinOsc">
          <sc-control name="freq" bind:value="freq"/>
        </sc-ugen>
      </sc-synthdef>
    `);
    expect(() => parsePlugin(XML)).toThrow(
      '<sc-control>: "bind:value" is not allowed on a synthdef param',
    );
  });

  it("rejects foreign attribute namespace prefixes", () => {
    expect(() =>
      parsePlugin(
        wrapXml(`<sc-var name="b" value="2"/><sc-var name="a" xmlns:x="urn:other" x:value="b"/>`),
      ),
    ).toThrow('<sc-var>: unknown attribute namespace prefix "x:" (use "bind:")');
  });

  it("rejects bind:attrs on runtime-opted-out attributes (direct validateProps)", () => {
    // `synthdef` is runtime-opted-out: a dynamic form must be rejected.
    const el = document.createElement("sc-synth") as ScElement;
    el.setAttribute("name", "s1");
    el.setAttribute("synthdef", "sine");
    el.setAttribute("bind:synthdef", "sine");
    expect(() => el.validateProps()).toThrow(
      '<sc-synth>: unknown runtime attribute "bind:synthdef"',
    );
  });

  it("requires sc-synth.synthdef", () => {
    expect(() => parsePlugin(wrapXml(`<sc-synth name="s1"/>`))).toThrow(
      '<sc-synth>: missing required "synthdef" attribute',
    );
  });

  it("resolution errors name the real attribute", () => {
    const XML = wrapXml(`
      <sc-var name="freq" value="440"/>
      <sc-slider bind:value="freq" bind:min="ghost.x"/>
    `);
    expect(() => parsePlugin(XML)).toThrow(
      '<sc-slider bind:min="ghost.x">: does not match any node in scope',
    );
  });

  it("a string-valued derived control keeps the UI but never reaches OSC", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const XML = wrapXml(`
      <sc-group name="vars">
        <sc-var name="mode" value="lin"/>
      </sc-group>
      <sc-synthdef name="sine">
        <sc-control name="freq" value="440"/>
        <sc-ugen name="osc" type="SinOsc">
          <sc-control name="freq" bind:value="freq"/>
        </sc-ugen>
        <sc-ugen name="out" type="Out">
          <sc-control name="bus" value="0"/>
          <sc-control name="channelsarray" bind:value="osc"/>
        </sc-ugen>
      </sc-synthdef>
      <sc-synth name="s1" synthdef="sine">
        <sc-control name="freq" bind:value="vars.mode"/>
      </sc-synth>
    `);
    const { host } = await mountPlugin(XML);
    const synth = host.querySelector("sc-synth") as ScSynth;
    const freq = host.querySelector("sc-synth sc-control") as ScControl;

    // The /s_new skipped the non-numeric pair (the synthdef default applies).
    const sNew = sent.find((m) => m.address === "/s_new")!;
    expect(sNew.args).toEqual(["sine", synth.nodeId, 1, host.nodeId]);
    // …the UI state carries the string…
    expect(freq._state).toBe("lin");
    // …and a recompute to another string warns instead of /n_set-ing.
    varByName(host, "mode").setValue("exp");
    expect(freq._state).toBe("exp");
    expect(nSets()).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("sc-button", () => {
  const BTN_XML = wrapXml(`
    <sc-var name="gate" value="0"/>
    <sc-button bind:value="gate" bind:icon="gate ? 'stop' : 'play'" bind:label="gate ? 'Stop' : 'Play'"/>
    <sc-button bind:value="gate" set="1" label="Trigger"/>
  `);
  const buttons = (host: ScPlugin) =>
    [...host.querySelectorAll("sc-button")] as Array<
      ScElement & { updateComplete: Promise<boolean> }
    >;
  const widgetButton = (el: Element) => el.querySelector("sc-base-button") as HTMLElement;
  const clickWidget = (el: Element) =>
    widgetButton(el).dispatchEvent(new Event("click", { bubbles: true, composed: true }));

  it("toggles the bound state 0 ↔ 1 and swaps its icon/label through the ternaries", async () => {
    const { host } = await mountPlugin(BTN_XML);
    const [toggle] = buttons(host);
    await toggle.updateComplete;
    expect(widgetButton(toggle).getAttribute("icon")).toBe("play");
    expect(widgetButton(toggle).getAttribute("label")).toBe("Play");

    clickWidget(toggle);
    expect(host.runtime.get()["gate"]).toBe(1);
    await toggle.updateComplete;
    expect(widgetButton(toggle).getAttribute("icon")).toBe("stop");
    expect(widgetButton(toggle).getAttribute("label")).toBe("Stop");

    clickWidget(toggle);
    expect(host.runtime.get()["gate"]).toBe(0);
  });

  it("a set attribute makes it a fixed-value trigger", async () => {
    const { host } = await mountPlugin(BTN_XML);
    const [, trigger] = buttons(host);
    clickWidget(trigger);
    expect(host.runtime.get()["gate"]).toBe(1);
    clickWidget(trigger); // already 1 — idempotent
    expect(host.runtime.get()["gate"]).toBe(1);
  });
});

describe("inputs on bind:value (Phase 3.2)", () => {
  const varByName = (host: ScPlugin, name: string) =>
    [...host.querySelectorAll("sc-var")].find(
      (v) => (v as ScVar).getProp("name") === name,
    ) as ScVar;

  it("an expression bind:value makes the input a read-only live meter", async () => {
    const XML = wrapXml(`
      <sc-group name="vars">
        <sc-var name="a" value="0.5"/>
      </sc-group>
      <sc-slider bind:value="vars.a * 2" min="0" max="4" step="0.01"/>
    `);
    const { host } = await mountPlugin(XML);
    const range = host.querySelector("sc-slider") as ScElement & {
      updateComplete: Promise<boolean>;
    };
    await range.updateComplete;
    expect(widgetOf(range).value).toBe(1); // 0.5 * 2, live

    varByName(host, "a").setValue(1.5);
    await range.updateComplete;
    expect(widgetOf(range).value).toBe(3); // follows the sources

    dragWidget(range, 0.25); // no writable target — the gesture is inert
    await range.updateComplete;
    expect(widgetOf(range).value).toBe(3); // snapped back
    expect(host.runtime.get()).toEqual({ "vars.a": 1.5 }); // store untouched
  });

  it("a static value is a fixed inert widget", async () => {
    const XML = wrapXml(`<sc-slider value="0.7" min="0" max="1" step="0.01"/>`);
    const { host } = await mountPlugin(XML);
    const range = host.querySelector("sc-slider") as ScElement & {
      updateComplete: Promise<boolean>;
    };
    await range.updateComplete;
    expect(widgetOf(range).value).toBe(0.7); // seeded from the attribute

    dragWidget(range, 0.2);
    await range.updateComplete;
    expect(widgetOf(range).value).toBe(0.7); // snapped back, nothing written
    expect(host.runtime.get()).toEqual({});
  });

  it("a value input requires the value binding (either form)", () => {
    expect(() => parsePlugin(wrapXml(`<sc-slider min="0" max="1"/>`))).toThrow(
      '<sc-slider>: missing required "value" attribute',
    );
  });

  it("sc-button demands a writable target — expressions and static values fail", () => {
    const BTN_ERROR = '<sc-button>: "bind:value" must reference a single writable control/var';
    expect(() =>
      parsePlugin(
        wrapXml(`
          <sc-var name="a" value="0"/>
          <sc-var name="b" value="1"/>
          <sc-button bind:value="a + b" label="x"/>
        `),
      ),
    ).toThrow(BTN_ERROR);
    expect(() => parsePlugin(wrapXml(`<sc-button value="1" label="x"/>`))).toThrow(BTN_ERROR);
    // A DERIVED target is read-only (setValue is inert) — equally rejected.
    expect(() =>
      parsePlugin(
        wrapXml(`
          <sc-group name="vars">
            <sc-var name="a" value="1"/>
            <sc-var name="doubled" bind:value="vars.a * 2"/>
          </sc-group>
          <sc-button bind:value="vars.doubled" label="x"/>
        `),
      ),
    ).toThrow(BTN_ERROR);
  });

  it("bind:set makes the click payload dynamic", async () => {
    const XML = wrapXml(`
      <sc-var name="preset" value="5"/>
      <sc-var name="gate" value="0"/>
      <sc-button bind:value="gate" bind:set="preset" label="Apply"/>
    `);
    const { host } = await mountPlugin(XML);
    const widget = host.querySelector("sc-base-button")!;
    widget.dispatchEvent(new Event("click", { bubbles: true, composed: true }));
    expect(host.runtime.get()["gate"]).toBe(5);
  });

  it("inputs do not dispatch statechange (only named state is targetable)", async () => {
    const XML = wrapXml(`
      <sc-group name="vars">
        <sc-var name="a" value="1"/>
      </sc-group>
      <sc-slider bind:value="vars.a" min="0" max="4"/>
      <sc-display bind:value="vars.a * 2"/>
    `);
    const { host } = await mountPlugin(XML);
    const leaked: Event[] = [];
    host.querySelector("sc-slider")!.addEventListener("statechange", (e) => leaked.push(e));
    host.querySelector("sc-display")!.addEventListener("statechange", (e) => leaked.push(e));
    const seen: StateValue[] = [];
    varByName(host, "a").onStateChange((v) => seen.push(v));

    varByName(host, "a").setValue(2); // recomputes both consumers
    expect(seen).toEqual([2]); // the state element still notifies
    expect(leaked).toEqual([]); // the consumers stay silent
  });

  it("a non-numeric evaluated numeric prop falls back to the widget default and warns once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const XML = wrapXml(`
      <sc-var name="mode" value="lin"/>
      <sc-var name="freq" value="440"/>
      <sc-slider bind:value="freq" bind:min="mode" max="2000"/>
    `);
    const { host } = await mountPlugin(XML);
    const range = host.querySelector("sc-slider") as ScElement & {
      updateComplete: Promise<boolean>;
    };
    await range.updateComplete;
    // ifDefined removes the invalid optional attribute, preserving the base
    // widget's own default instead of feeding its converter an empty string.
    expect(widgetOf(range).getAttribute("min")).toBeNull();
    expect((widgetOf(range) as ValueWidget & { min: number }).min).toBe(0);
    expect(widgetOf(range).getAttribute("max")).toBe("2000");
    const warns = warn.mock.calls.filter(([m]) => String(m).includes("bind:min"));
    expect(warns).toHaveLength(1); // once per element+prop, across re-renders
    warn.mockRestore();
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
