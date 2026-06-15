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

vi.mock("@strudel/codemirror", () => ({
  StrudelMirror: class {
    stop() {}
    clear() {}
    evaluate() {}
  },
}));
vi.mock("@strudel/transpiler", () => ({ transpiler: () => undefined }));
vi.mock("@/lib/strudel/prebake", () => ({ ensureStrudelGlobals: async () => undefined }));

import { OSC } from "@sc-app/server-commands";
import { oscClient } from "@/lib/osc/OscClient";
import { appStore } from "@/stores/store";
import { setRuntimeValue } from "@/stores/runtime";
import { registerScElements, type ScControl, type ScDisplay, type ScElement, type ScPlugin, type ScSynth, type ScSynthDef } from "@/sc-elements";
import { formatValue } from "@/sc-elements/visuals/sc-display";
import { autoRespond, FIRST_NODE_ID, installScsynthMock, mountPlugin, parsePlugin, SESSION_GROUP } from "@/lib/utils/test/test-utils";
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

beforeAll(() => {
  registerScElements();
});

beforeEach(() => {
  ({ sent, send } = installScsynthMock());
});

afterEach(() => {
  document.body.replaceChildren(); // disconnects → unload paths run
  vi.restoreAllMocks();
  appStore.update((s) => ({ ...s, runtime: {}, osc: { ...s.osc, connected: false } }));
});

/** Drive the `connected` signal the plugins live on (the osc slice). */
const setConnected = (connected: boolean) =>
  appStore.update((s) => ({ ...s, osc: { ...s.osc, connected } }));

describe("load pass", () => {
  it("seeds exactly the enabled controls' defaults, keyed by full path", async () => {
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
      "sine", synth.nodeId, 1, groupId,
      "freq", 440, "amp", 0.2, "pan", 0, "mute", 0,
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
    const loading = host.load().catch(() => {}).finally(() => (settled = true));
    await new Promise((r) => setTimeout(r, 10));
    expect(settled).toBe(false);
    expect(sent.map((m) => m.address)).toEqual(["/g_new", "/d_recv"]);
    oscClient.close(); // reject the pending waiter so the test ends cleanly
    await loading;
  });
});

describe("ScControl.setValue", () => {
  it("writes the store, mirrors its own value prop, and sends exactly one /n_set", async () => {
    const { host } = await mountExample();
    const freq = control(host, "freq");
    const synth = host.querySelector("sc-synth") as ScSynth;

    freq.setValue(550);
    expect(appStore.get().runtime[host.id]["s1.freq"]).toBe(550);
    expect(freq.value).toBe(550);
    expect(nSets()).toHaveLength(1);
    expect(nSets()[0].args).toEqual([synth.nodeId, "freq", 550]);
  });

  it("is idempotent — re-setting the current value sends nothing", async () => {
    const { host } = await mountExample();
    control(host, "freq").setValue(440); // the seeded default
    expect(nSets()).toHaveLength(0);
  });

  it("a direct store write is UI-only: views refresh, no /n_set", async () => {
    const { host } = await mountExample();
    const freq = control(host, "freq");
    const range = host.querySelector("sc-range") as ScElement & { updateComplete: Promise<boolean> };

    setRuntimeValue(host.id, "s1.freq", 660);
    await range.updateComplete;
    expect(freq.value).toBe(660);
    expect((range.querySelector("input") as HTMLInputElement).value).toBe("660");
    expect(nSets()).toHaveLength(0);
  });
});

describe("inputs and display", () => {
  it("range input events flow store → /n_set → sibling display", async () => {
    const { host } = await mountExample();
    const synth = host.querySelector("sc-synth") as ScSynth;
    // The first range binds s1.freq; its sibling display formats "%d Hz".
    const range = host.querySelector('sc-range[bind="s1.freq"]')!;
    const display = host.querySelector('sc-display[bind="s1.freq"]') as ScDisplay;

    const input = range.querySelector("input") as HTMLInputElement;
    input.value = "880";
    input.dispatchEvent(new Event("input"));

    expect(appStore.get().runtime[host.id]["s1.freq"]).toBe(880);
    expect(nSets()).toHaveLength(1);
    expect(nSets()[0].args).toEqual([synth.nodeId, "freq", 880]);
    await display.updateComplete;
    expect(display.textContent).toBe("880 Hz");
  });

  it("checkbox maps checked to 1/0 and follows external store writes", async () => {
    const { host } = await mountExample();
    const synth = host.querySelector("sc-synth") as ScSynth;
    const checkbox = host.querySelector("sc-checkbox") as ScElement & { updateComplete: Promise<boolean> };
    const input = checkbox.querySelector("input") as HTMLInputElement;
    expect(input.checked).toBe(false); // seeded default 0

    input.checked = true;
    input.dispatchEvent(new Event("change"));
    expect(appStore.get().runtime[host.id]["s1.mute"]).toBe(1);
    expect(nSets()[0].args).toEqual([synth.nodeId, "mute", 1]);

    setRuntimeValue(host.id, "s1.mute", 0);
    await checkbox.updateComplete;
    expect(input.checked).toBe(false);
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
    const input = host.querySelector('sc-range[bind="s1.freq"] input') as HTMLInputElement;

    host.remove();
    expect(appStore.get().runtime[host.id]).toBeUndefined();

    // A write straight into the slice reaches no detached element.
    setRuntimeValue(host.id, "s1.freq", 999);
    expect(freq.value).toBe(440);
    expect(input.value).toBe("440");
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
      "sine", synth.nodeId, 1, host.nodeId,
      "freq", 880, "amp", 0.2, "pan", 0, "mute", 0,
    ]);

    // The store wiring was rebuilt, not duplicated: an external write still
    // refreshes the input through the fresh subscription.
    const range = host.querySelector('sc-range[bind="s1.freq"]') as ScElement & { updateComplete: Promise<boolean> };
    setRuntimeValue(host.id, "s1.freq", 700);
    await range.updateComplete;
    expect((range.querySelector("input") as HTMLInputElement).value).toBe("700");
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
