// Widget lifecycle + parametrization gate: sc-scope's per-element tap (bus/
// channels → tap synthdef + scope-slot subscription, through the load/unload
// pass) and sc-strudel's value/bind:value code flow + orbit stamping. Same
// scripted-scsynth recipe as controls.test.ts: oscClient.send is mocked into
// an auto-responder feeding the real handleReply, so the sequenced commands
// gate exactly as against a live server. The scope-slot allocator is armed
// directly on the client (connect() needs a live worker).

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { flattenPacket, type OscMessage } from "@sc-app/server-commands";
import { validateEntry } from "@/lib/plugins/validate";
import { oscClient } from "@/lib/osc/OscClient";
import { registerScElements, type ScPlugin } from "@/sc-elements";
import type { ScKeyboard } from "@/sc-elements/widgets/sc-keyboard";
import type { ScScope } from "@/sc-elements/widgets/sc-scope";
import type { ScStrudel } from "@/sc-elements/widgets/sc-strudel";
import {
  autoRespond,
  installScsynthMock,
  mountPlugin,
  parsePlugin,
  wrapXml,
  SESSION_GROUP,
} from "@/lib/utils/test/test-utils";
// @strudel/codemirror is aliased to this recording stub globally
// (vite.config.ts test.alias); strudelMirrors holds the editors sc-strudel
// constructed this test, in order.
import { strudelMirrors } from "@/lib/utils/test/stubs/strudel-codemirror";
import strudelStyles from "@/sc-elements/widgets/sc-strudel/sc-strudel.module.scss";

const oscMessage = (address: string, ...args: OscMessage["args"]): OscMessage => ({
  address,
  args,
});

const SCOPE_BASE = 8;
const SCOPE_COUNT = 8;

let sent: OscMessage[];
let send: ReturnType<typeof installScsynthMock>["send"];

/** Emulate the worker-side scope-slot allocator (free-list over the span)
 *  on the client seam — the real one lives in the shared worker
 *  (sessions.ts), out of happy-dom's reach. */
function armScopeAllocator(): void {
  let used = 0;
  const free: number[] = [];
  vi.spyOn(oscClient, "allocScopeIndex").mockImplementation(() => {
    const recycled = free.pop();
    if (recycled !== undefined) return Promise.resolve(recycled);
    if (used >= SCOPE_COUNT) {
      return Promise.reject(new Error(`scope-slot block exhausted (${SCOPE_COUNT} per session)`));
    }
    return Promise.resolve(SCOPE_BASE + used++);
  });
  vi.spyOn(oscClient, "freeScopeIndex").mockImplementation((index: number) => {
    if (index < SCOPE_BASE || index >= SCOPE_BASE + SCOPE_COUNT) return;
    if (!free.includes(index)) free.push(index);
  });
  (oscClient as unknown as { nextSubId: number }).nextSubId = 1;
}

const mountXml = async (bodyXml: string): Promise<ScPlugin> =>
  (await mountPlugin(wrapXml(bodyXml))).host;

/** Simulate CodeMirror's per-keystroke update: its internal change handler
 *  updates mirror.code before the contenteditable input event bubbles. */
function typeInStrudel(code: string): void {
  const mirror = strudelMirrors[0];
  mirror.code = code;
  (mirror.opts.root as HTMLElement).dispatchEvent(new Event("input", { bubbles: true }));
}

/** A /scope/chunk frame's blob: big-endian f32, planar (one frame run per
 *  channel — the SHM slot's own layout). */
function beBlob(floats: number[]): Uint8Array {
  const bytes = new Uint8Array(floats.length * 4);
  const dv = new DataView(bytes.buffer);
  floats.forEach((f, i) => dv.setFloat32(i * 4, f, false));
  return bytes;
}

beforeAll(() => {
  registerScElements();
});

beforeEach(() => {
  strudelMirrors.length = 0;
  ({ sent, send } = installScsynthMock());
  armScopeAllocator();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("sc-scope", () => {
  it("evaluates and subscribes runtime-bound display properties", async () => {
    const host = await mountXml(
      '<sc-var name="scopeGain" value="2"/><sc-scope bind:gain="scopeGain"/>',
    );
    const scope = host.querySelector("sc-scope") as ScScope;
    const gain = host.querySelector("sc-var") as HTMLElement & {
      setValue(value: number): void;
    };

    expect(scope.getProp("gain") as number).toBe(2);
    gain.setValue(3);
    expect(scope.getProp("gain") as number).toBe(3);
  });

  it("releases a late tap and its scope slot when load was invalidated", async () => {
    let pendingTap: OscMessage | undefined;
    send.mockImplementation((packet) => {
      const msg = packet as OscMessage;
      sent.push(msg);
      if (msg.address === "/s_new") pendingTap = msg;
      else autoRespond(msg);
    });

    const { host } = parsePlugin(wrapXml("<sc-scope/>"));
    document.body.appendChild(host);
    await host.updateComplete;
    const scope = host.querySelector("sc-scope") as ScScope;
    const loading = host.load();
    await vi.waitFor(() => expect(pendingTap).toBeDefined());
    const staleTapId = pendingTap!.args[1] as number;

    host.unload();
    autoRespond(pendingTap!);
    await loading;

    expect(scope.loaded).toBe(false);
    expect(sent.map((m) => [m.address, m.args[0]])).toContainEqual(["/n_free", staleTapId]);
    expect(sent.some((m) => m.address === "/scope/subscribe")).toBe(false);
    const recycled = await oscClient.allocScopeIndex();
    expect(recycled).toBe(SCOPE_BASE);
    oscClient.freeScopeIndex(recycled);
  });

  it("loads a parametrized tap: def per channels, inBus/scopeNum controls, slot subscribe", async () => {
    const host = await mountXml('<sc-scope bus="16" channels="1"/>');
    const scope = host.querySelector("sc-scope") as ScScope;

    expect(sent.map((m) => m.address)).toEqual(["/g_new", "/d_recv", "/s_new", "/scope/subscribe"]);
    const sNew = sent[2];
    expect(sNew.args[0]).toBe("scopeTap1ch_1024");
    expect(sNew.args.slice(2)).toEqual([1, SESSION_GROUP, "inBus", 16, "scopeNum", SCOPE_BASE]);
    expect(sent[3].args).toEqual([1, SCOPE_BASE, 1, 1024]); // subId, slot, channels, chunk
    expect(scope.loaded).toBe(true);
  });

  it("compiles the tap per (channels, frames) and subscribes with the window size", async () => {
    await mountXml('<sc-scope channels="1" frames="2048"/>');
    const sNew = sent[2];
    expect(sNew.args[0]).toBe("scopeTap1ch_2048");
    expect(sent[3].args).toEqual([1, SCOPE_BASE, 1, 2048]); // subId, slot, channels, frames
  });

  it("defaults to the stereo master out", async () => {
    await mountXml("<sc-scope/>");
    const sNew = sent[2];
    expect(sNew.args[0]).toBe("scopeTap2ch_1024");
    expect(sNew.args.slice(4)).toEqual(["inBus", 0, "scopeNum", SCOPE_BASE]);
  });

  it("routes /scope/chunk frames by subId into its own chunkRef", async () => {
    const host = await mountXml("<sc-scope/>");
    const scope = host.querySelector("sc-scope") as ScScope;
    const subId = sent[3].args[0] as number;

    oscClient.handleReply(oscMessage("/scope/chunk", subId + 99, 1, 0, 2, beBlob([0.5, -0.5])));
    expect(scope.chunkRef.current).toBeNull(); // foreign subId ignored

    oscClient.handleReply(oscMessage("/scope/chunk", subId, 1, 0, 2, beBlob([0.5, -0.5])));
    expect(scope.chunkRef.current).toMatchObject({ subId, channels: 2, frameCount: 1 });
    expect(scope.chunkRef.current!.data[0]).toBeCloseTo(0.5);
  });

  it("gives concurrent scopes distinct slots and subIds", async () => {
    const host = await mountXml("<sc-scope/><sc-scope/>");
    const subscribes = sent.filter((m) => m.address === "/scope/subscribe");
    expect(subscribes).toHaveLength(2);
    const [a, b] = subscribes;
    expect(a.args[0]).not.toBe(b.args[0]); // subIds
    expect(a.args[1]).not.toBe(b.args[1]); // slots
    expect(host.querySelectorAll("sc-scope")).toHaveLength(2);
  });

  it("unloads on unmount — unsubscribe + tap free — and recycles the slot", async () => {
    const host = await mountXml("<sc-scope/>");
    const scope = host.querySelector("sc-scope") as ScScope;
    const tapId = sent[2].args[1] as number;
    const subId = sent[3].args[0] as number;

    sent.length = 0;
    host.remove();
    const teardown = sent.map((m) => [m.address, m.args[0]]);
    expect(teardown).toContainEqual(["/scope/unsubscribe", subId]);
    expect(teardown).toContainEqual(["/n_free", tapId]);
    expect(scope.loaded).toBe(false);
    expect(scope.chunkRef.current).toBeNull();

    // The freed slot is recycled by the next mount.
    sent.length = 0;
    await mountXml("<sc-scope/>");
    const resub = sent.find((m) => m.address === "/scope/subscribe")!;
    expect(resub.args[1]).toBe(SCOPE_BASE);
    expect(resub.args[0]).not.toBe(subId); // subIds are never reused
  });

  it("rejects invalid bus/channels at parse", async () => {
    await expect(mountXml('<sc-scope channels="0"/>')).rejects.toThrow(
      '"channels" attribute must be ≥ 1 (got "0")',
    );
    document.body.replaceChildren();
    await expect(mountXml('<sc-scope bus="-1"/>')).rejects.toThrow(
      '"bus" attribute must be ≥ 0 (got "-1")',
    );
    document.body.replaceChildren();
    await expect(mountXml('<sc-scope frames="0"/>')).rejects.toThrow(
      '"frames" attribute must be ≥ 1 (got "0")',
    );
    document.body.replaceChildren();
    await expect(mountXml('<sc-scope frames="32768"/>')).rejects.toThrow(
      '"frames" attribute must be ≤ 16384 (got "32768")',
    );
  });

  it("parses the display props (and defaults them per the scope conventions)", async () => {
    const host = await mountXml(
      '<sc-scope channels="1" trigger="normal" slope="falling" level="0.1" gain="2" layout="split"/>',
    );
    // The display props are declarative — read (coerced + defaulted) through
    // the spec-backed getProp path.
    const scope = host.querySelector("sc-scope") as ScScope;
    expect([
      scope.getProp("trigger") as string,
      scope.getProp("slope") as string,
      scope.getProp("level") as number,
      scope.getProp("gain") as number,
      scope.getProp("layout") as string,
    ]).toEqual(["normal", "falling", 0.1, 2, "split"]);

    document.body.replaceChildren();
    const bare = await mountXml("<sc-scope/>");
    const def = bare.querySelector("sc-scope") as ScScope;
    expect([
      def.getProp("trigger") as string,
      def.getProp("slope") as string,
      def.getProp("level") as number,
      def.getProp("gain") as number,
      def.getProp("layout") as string,
    ]).toEqual(["auto", "rising", 0, 1, "overlay"]);
  });

  it("rejects invalid display props at parse", async () => {
    await expect(mountXml('<sc-scope trigger="bogus"/>')).rejects.toThrow(
      '"trigger" attribute must be one of auto|normal|off (got "bogus")',
    );
    document.body.replaceChildren();
    await expect(mountXml('<sc-scope slope="up"/>')).rejects.toThrow(
      '"slope" attribute must be one of rising|falling (got "up")',
    );
    document.body.replaceChildren();
    await expect(mountXml('<sc-scope gain="0"/>')).rejects.toThrow(
      '"gain" attribute must be > 0 (got "0")',
    );
    document.body.replaceChildren();
    await expect(mountXml('<sc-scope layout="stack"/>')).rejects.toThrow(
      '"layout" attribute must be one of overlay|split (got "stack")',
    );
  });

  it("resolves the drawn window per trigger mode: pin, fallback, hold", async () => {
    const mkChunk = (data: Float32Array) => ({
      subId: 1,
      tickIndex: 0,
      isGap: false,
      channels: 1,
      frameCount: data.length,
      data,
    });
    // 8 cycles in 1024 samples starting at the trough: rising zero-crossing
    // at sample 32 — inside the 256-sample search headroom.
    const periodic = new Float32Array(1024);
    for (let i = 0; i < 1024; i++)
      periodic[i] = 0.5 * Math.sin(-Math.PI / 2 + (2 * Math.PI * 8 * i) / 1024);
    const triggerless = new Float32Array(1024).fill(0.5); // DC — never crosses

    const host = await mountXml('<sc-scope channels="1" trigger="normal"/>');
    const scope = host.querySelector("sc-scope") as ScScope;
    const resolve = (c: ReturnType<typeof mkChunk>) =>
      (
        scope as unknown as {
          resolveWindow(c: unknown): { chunk: unknown; offset: number; span: number } | null;
        }
      ).resolveWindow(c);

    // Triggered: pinned to the crossing, ¾ window after the search headroom.
    const a = resolve(mkChunk(periodic));
    expect(a).toMatchObject({ offset: 32, span: 768 });

    // normal + no trigger: the last triggered window is held verbatim.
    const b = resolve(mkChunk(triggerless));
    expect(b).toBe(a);

    // auto + no trigger: free-runs the new chunk from sample 0.
    scope.setAttribute("trigger", "auto");
    const c = resolve(mkChunk(triggerless));
    expect(c).toMatchObject({ offset: 0, span: 768 });
    expect(c!.chunk).not.toBe(a!.chunk);

    // off: the raw full window.
    scope.setAttribute("trigger", "off");
    expect(resolve(mkChunk(periodic))).toMatchObject({ offset: 0, span: 1024 });
  });
});

describe("sc-strudel", () => {
  it("decodes static value code and falls back to the default code", async () => {
    const host = await mountXml(`<sc-strudel value='s("bd")\\ns("hh")'/>`);
    const strudel = host.querySelector("sc-strudel") as ScStrudel;
    await strudel.updateComplete;
    expect(strudelMirrors).toHaveLength(1);
    expect(strudelMirrors[0].opts.initialCode).toBe('s("bd")\ns("hh")');
    expect(strudel.querySelector(`.${strudelStyles.editor}`)).not.toBeNull();
    expect(strudelMirrors[0].opts.setInterval).toEqual(expect.any(Function));
    expect(strudelMirrors[0].opts.clearInterval).toEqual(expect.any(Function));
    const now = performance.now() / 1000;
    expect(strudelMirrors[0].opts.getTime()).toBeCloseTo(now);

    document.body.replaceChildren();
    const defaultHost = await mountXml("<sc-strudel/>");
    await (defaultHost.querySelector("sc-strudel") as ScStrudel).updateComplete;
    expect(strudelMirrors[1].opts.initialCode).toContain('s("bd hh*2 sd hh")');
  });

  it("reads and writes a plain-path bind per editor input", async () => {
    const host = await mountXml(
      `<sc-var name="code" value='s("bd")\\ns("hh")'/><sc-strudel bind:value="code"/>`,
    );
    await (host.querySelector("sc-strudel") as ScStrudel).updateComplete;
    const mirror = strudelMirrors[0];
    expect(mirror.setCode).toHaveBeenCalledWith('s("bd")\ns("hh")');

    typeInStrudel('s("sd")');
    expect(host.runtime.get().code).toBe('s("sd")');
    typeInStrudel('s("sd hh")');
    expect(host.runtime.get().code).toBe('s("sd hh")');
  });

  it("syncs external writes with a same-code loop guard", async () => {
    const host = await mountXml(
      `<sc-var name="code" value="first"/><sc-strudel bind:value="code"/>`,
    );
    await (host.querySelector("sc-strudel") as ScStrudel).updateComplete;
    const mirror = strudelMirrors[0];
    mirror.setCode.mockClear();

    host.runtime.update((state) => ({ ...state, code: "second" }));
    expect(mirror.setCode).toHaveBeenCalledOnce();
    expect(mirror.setCode).toHaveBeenCalledWith("second");
    mirror.setCode.mockClear();
    host.runtime.update((state) => ({ ...state, code: "second" }));
    expect(mirror.setCode).not.toHaveBeenCalled();
  });

  it("keeps expression binds read-only while still driving the editor", async () => {
    const host = await mountXml(
      `<sc-var name="choice" value="1"/><sc-strudel bind:value="choice ? 'a' : 'b'"/>`,
    );
    await (host.querySelector("sc-strudel") as ScStrudel).updateComplete;
    const mirror = strudelMirrors[0];
    expect(mirror.setCode).toHaveBeenCalledWith("a");
    const before = host.runtime.get();

    typeInStrudel("typed");
    expect(host.runtime.get()).toBe(before);
    expect(mirror.setCode).toHaveBeenLastCalledWith("a");
    host.runtime.update((state) => ({ ...state, choice: 0 }));
    expect(mirror.setCode).toHaveBeenLastCalledWith("b");
  });

  it("rejects static value together with bind:value", () => {
    expect(() => validateEntry(wrapXml(`<sc-strudel value="a" bind:value="code"/>`))).toThrow(
      '<sc-strudel>: "value" and "bind:value" are mutually exclusive',
    );
  });

  it("stamps its orbit onto dirt events the pattern didn't route", async () => {
    const host = await mountXml('<sc-strudel orbit="2"></sc-strudel>');
    await (host.querySelector("sc-strudel") as ScStrudel).updateComplete;
    const out = strudelMirrors[0].opts.defaultOutput as (
      hap: { value: unknown },
      d: number,
      du: number,
      cps: number,
      t: number,
    ) => void;

    sent.length = 0;
    out({ value: { s: "bd" } }, 0, 0, 1, 0);
    out({ value: { s: "sd", orbit: 5 } }, 0, 0, 1, 0);
    const plays = sent.map((p) => flattenPacket(p)[0]).filter((m) => m.address === "/dirt/play");
    expect(plays).toHaveLength(2);
    expect(plays[0].args).toEqual(["s", "bd", "orbit", "2"]);
    expect(plays[1].args).toEqual(["s", "sd", "orbit", "5"]); // pattern's own orbit wins
  });

  it("stops playback on unload (connection loss)", async () => {
    const host = await mountXml("<sc-strudel></sc-strudel>");
    const strudel = host.querySelector("sc-strudel") as ScStrudel;
    await strudel.updateComplete;
    strudelMirrors[0].opts.onToggle(true); // playing
    strudel.unload();
    expect(strudelMirrors[0].stop).toHaveBeenCalled();
  });

  it("rejects a negative orbit at parse", async () => {
    await expect(mountXml('<sc-strudel orbit="-1"></sc-strudel>')).rejects.toThrow(
      '"orbit" attribute must be ≥ 0 (got "-1")',
    );
  });
});

describe("sc-keyboard", () => {
  // A compilable synthdef the keyboard spawns voices from (plain gate/amp
  // multiply — the demo example exercises the Linen self-free variant).
  const KBD = `<sc-synthdef name="kbd">
    <sc-control name="freq" value="440"/>
    <sc-control name="amp" value="0.2"/>
    <sc-control name="gate" value="1"/>
    <sc-ugen name="osc" type="SinOsc"><sc-control name="freq" bind:value="freq"/></sc-ugen>
    <sc-ugen name="sig" type="BinaryOpUGen" op="*">
      <sc-control name="a" bind:value="osc"/>
      <sc-control name="b" bind:value="amp"/>
    </sc-ugen>
    <sc-ugen name="out" type="Out">
      <sc-control name="bus" value="0"/>
      <sc-control name="channelsarray" bind:value="sig,sig"/>
    </sc-ugen>
  </sc-synthdef>`;

  const mountKeyboard = async (attrs = ""): Promise<{ host: ScPlugin; kbd: ScKeyboard }> => {
    const host = await mountXml(`${KBD}<sc-keyboard synthdef="kbd" ${attrs}/>`);
    return { host, kbd: host.querySelector("sc-keyboard") as ScKeyboard };
  };

  const sNews = () => sent.filter((m) => m.address === "/s_new");
  const nSets = () => sent.filter((m) => m.address === "/n_set");

  it("parses/mounts and stays lazy — no voice until a key is pressed", async () => {
    const { host, kbd } = await mountKeyboard();
    expect(kbd).not.toBeNull();
    expect(sent.map((m) => m.address)).toEqual(["/g_new", "/d_recv"]);
    expect(host.nodeId).not.toBe(0);
  });

  it("never reflects a foreign attribute onto the host (the static gate rejects it)", async () => {
    // The focusable tabindex lives on the inner container — a reflected host
    // attribute would fail the static gate when render precedes process (the
    // real-app load order).
    const { kbd } = await mountKeyboard();
    await kbd.updateComplete;
    expect(kbd.hasAttribute("tabindex")).toBe(false);
    expect(kbd.querySelector("[tabindex]")).not.toBeNull();
  });

  it("rejects a synthdef that names no <sc-synthdef>", async () => {
    await expect(mountXml(`${KBD}<sc-keyboard synthdef="nope"/>`)).rejects.toThrow(
      '<sc-keyboard synthdef="nope">: does not match any <sc-synthdef>',
    );
  });

  it("noteOn spawns a voice into the plugin group with mapped freq + amp", async () => {
    const { host, kbd } = await mountKeyboard();
    sent.length = 0;
    await kbd.noteOn(69, 0.5); // A4 → 440 Hz

    expect(sNews()).toHaveLength(1);
    const sNew = sNews()[0];
    expect(sNew.args[0]).toBe("kbd");
    expect(sNew.args[3]).toBe(host.nodeId); // target = plugin group
    expect(sNew.args.slice(4)).toEqual(["freq", 440, "amp", 0.5]);
  });

  it("noteOff sets gate 0 on the held voice and empties the map", async () => {
    const { kbd } = await mountKeyboard();
    await kbd.noteOn(69, 0.5);
    const voiceId = sNews()[0].args[1] as number;
    sent.length = 0;

    kbd.noteOff(69);
    expect(nSets()).toHaveLength(1);
    expect(nSets()[0].args).toEqual([voiceId, "gate", 0]);

    // A repeat noteOff is a no-op — the voice is gone.
    sent.length = 0;
    kbd.noteOff(69);
    expect(nSets()).toHaveLength(0);
  });

  it("maps custom param names onto the /s_new + /n_set", async () => {
    const { kbd } = await mountKeyboard('freq="hz" amp="level" gate="g"');
    sent.length = 0;
    await kbd.noteOn(69, 0.25);
    const sNew = sNews()[0];
    expect(sNew.args.slice(4)).toEqual(["hz", 440, "level", 0.25]);
    const voiceId = sNew.args[1] as number;

    sent.length = 0;
    kbd.noteOff(69);
    expect(nSets()[0].args).toEqual([voiceId, "g", 0]);
  });

  it("defers a release that races the /n_go ack, firing exactly one gate 0", async () => {
    const { host } = await mountKeyboard();
    const kbd = host.querySelector("sc-keyboard") as ScKeyboard;

    // Withhold the /s_new reply so the voice stays pending.
    let pending: OscMessage | undefined;
    send.mockImplementation((packet) => {
      const msg = packet as OscMessage;
      sent.push(msg);
      if (msg.address === "/s_new") pending = msg;
      else autoRespond(msg);
    });

    sent.length = 0;
    const on = kbd.noteOn(69, 0.5);
    await vi.waitFor(() => expect(pending).toBeDefined());
    kbd.noteOff(69); // released before the ack — no /n_set yet (no node id)
    expect(nSets()).toHaveLength(0);

    autoRespond(pending!); // deliver /n_go
    await on;

    const voiceId = pending!.args[1] as number;
    expect(nSets()).toHaveLength(1);
    expect(nSets()[0].args).toEqual([voiceId, "gate", 0]);
    expect((kbd as unknown as { held: Map<number, unknown> }).held.size).toBe(0);
  });

  it("spawns a voice from an on-screen key press (pointer wiring)", async () => {
    const { kbd } = await mountKeyboard('octaves="2" start="48"');
    const key = kbd.querySelector('[data-note="60"]') as HTMLElement; // C5, a white key
    expect(key).not.toBeNull();

    sent.length = 0;
    key.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    await vi.waitFor(() => expect(sNews()).toHaveLength(1));
    const sNew = sNews()[0];
    expect(sNew.args[0]).toBe("kbd");
    expect(sNew.args[4]).toBe("freq");
    expect(sNew.args[5] as number).toBeCloseTo(261.63, 1); // midicps(60)
  });

  it("releases every held note when focus leaves the keyboard", async () => {
    const { kbd } = await mountKeyboard();
    await kbd.noteOn(60, 0.5);
    await kbd.noteOn(64, 0.5);
    sent.length = 0;

    // Focus moving WITHIN the keyboard keeps the notes held.
    kbd.dispatchEvent(new FocusEvent("focusout", { relatedTarget: kbd.querySelector("div") }));
    expect(nSets()).toHaveLength(0);

    // Focus leaving (e.g. a click into the envelope editor) releases all —
    // the element-level keyup can never arrive once focus is gone.
    kbd.dispatchEvent(new FocusEvent("focusout", { relatedTarget: document.body }));
    const gates = nSets().filter((m) => m.args[1] === "gate" && m.args[2] === 0);
    expect(gates).toHaveLength(2);
    expect((kbd as unknown as { held: Map<number, unknown> }).held.size).toBe(0);
  });

  it("drops held voices on unload (connection loss)", async () => {
    const { kbd } = await mountKeyboard();
    await kbd.noteOn(69, 0.5);
    expect((kbd as unknown as { held: Map<number, unknown> }).held.size).toBe(1);
    kbd.unload();
    expect((kbd as unknown as { held: Map<number, unknown> }).held.size).toBe(0);
  });

  it("rejects an invalid range at parse", async () => {
    await expect(mountXml(`${KBD}<sc-keyboard synthdef="kbd" octaves="0"/>`)).rejects.toThrow(
      '"octaves" attribute must be ≥ 1 (got "0")',
    );
    document.body.replaceChildren();
    await expect(mountXml(`${KBD}<sc-keyboard synthdef="kbd" start="200"/>`)).rejects.toThrow(
      '"start" attribute must be ≤ 127 (got "200")',
    );
  });
});
