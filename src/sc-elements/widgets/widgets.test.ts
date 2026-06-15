// Widget lifecycle + parametrization gate: sc-scope's per-element tap (bus/
// channels → tap synthdef + scope-slot subscription, through the load/unload
// pass) and sc-strudel's text-content initial code + orbit stamping. Same
// scripted-scsynth recipe as controls.test.ts: oscClient.send is mocked into
// an auto-responder feeding the real handleReply, so the sequenced commands
// gate exactly as against a live server. The scope-slot allocator is armed
// directly on the client (connect() needs a live worker).

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { flattenPacket, OSC } from "@sc-app/server-commands";
import { oscClient } from "@/lib/osc/OscClient";
import { registerScElements, type ScPlugin } from "@/sc-elements";
import type { ScScope } from "@/sc-elements/widgets/sc-scope";
import type { ScStrudel } from "@/sc-elements/widgets/sc-strudel";
import { installScsynthMock, mountPlugin, wrapXml, SESSION_GROUP } from "@/lib/utils/test/test-utils";
// @strudel/codemirror is aliased to this recording stub globally
// (vite.config.ts test.alias); strudelMirrors holds the editors sc-strudel
// constructed this test, in order.
import { strudelMirrors } from "@/lib/utils/test/stubs/strudel-codemirror";

const SCOPE_BASE = 8;
const SCOPE_COUNT = 8;

let sent: OSC.Message[];

/** Arm the private scope-slot allocator (normally done by connect()). */
function armScopeAllocator(): void {
  const c = oscClient as unknown as {
    scopeBase: number;
    scopeCount: number;
    scopeUsed: number;
    freeScopeSlots: number[];
    nextSubId: number;
  };
  c.scopeBase = SCOPE_BASE;
  c.scopeCount = SCOPE_COUNT;
  c.scopeUsed = 0;
  c.freeScopeSlots = [];
  c.nextSubId = 1;
}

function disarmScopeAllocator(): void {
  (oscClient as unknown as { scopeCount: number }).scopeCount = 0;
}

const mountXml = async (bodyXml: string): Promise<ScPlugin> =>
  (await mountPlugin(wrapXml(bodyXml))).host;

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
  ({ sent } = installScsynthMock());
  armScopeAllocator();
});

afterEach(() => {
  document.body.replaceChildren();
  disarmScopeAllocator();
  vi.restoreAllMocks();
});

describe("sc-scope", () => {
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

    oscClient.handleReply(
      new OSC.Message("/scope/chunk", subId + 99, 1, 0, 2, beBlob([0.5, -0.5])),
    );
    expect(scope.chunkRef.current).toBeNull(); // foreign subId ignored

    oscClient.handleReply(new OSC.Message("/scope/chunk", subId, 1, 0, 2, beBlob([0.5, -0.5])));
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
      '"channels" attribute must be a positive integer (got "0")',
    );
    document.body.replaceChildren();
    await expect(mountXml('<sc-scope bus="-1"/>')).rejects.toThrow(
      '"bus" attribute must be a non-negative integer (got "-1")',
    );
    document.body.replaceChildren();
    await expect(mountXml('<sc-scope frames="0"/>')).rejects.toThrow(
      '"frames" attribute must be a positive integer (got "0")',
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
    const scope = host.querySelector("sc-scope") as ScScope;
    expect([scope.trigger, scope.slope, scope.level, scope.gain, scope.layout]).toEqual([
      "normal", "falling", 0.1, 2, "split",
    ]);

    document.body.replaceChildren();
    const bare = await mountXml("<sc-scope/>");
    const def = bare.querySelector("sc-scope") as ScScope;
    expect([def.trigger, def.slope, def.level, def.gain, def.layout]).toEqual([
      "auto", "rising", 0, 1, "overlay",
    ]);
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
      '"gain" attribute must be a positive number (got "0")',
    );
    document.body.replaceChildren();
    await expect(mountXml('<sc-scope layout="stack"/>')).rejects.toThrow(
      '"layout" attribute must be one of overlay|split (got "stack")',
    );
  });

  it("resolves the drawn window per trigger mode: pin, fallback, hold", async () => {
    const mkChunk = (data: Float32Array) => ({
      subId: 1, tickIndex: 0, isGap: false, channels: 1, frameCount: data.length, data,
    });
    // 8 cycles in 1024 samples starting at the trough: rising zero-crossing
    // at sample 32 — inside the 256-sample search headroom.
    const periodic = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) periodic[i] = 0.5 * Math.sin(-Math.PI / 2 + (2 * Math.PI * 8 * i) / 1024);
    const triggerless = new Float32Array(1024).fill(0.5); // DC — never crosses

    const host = await mountXml('<sc-scope channels="1" trigger="normal"/>');
    const scope = host.querySelector("sc-scope") as ScScope;
    const resolve = (c: ReturnType<typeof mkChunk>) =>
      (scope as unknown as { resolveWindow(c: unknown): { chunk: unknown; offset: number; span: number } | null })
        .resolveWindow(c);

    // Triggered: pinned to the crossing, ¾ window after the search headroom.
    const a = resolve(mkChunk(periodic));
    expect(a).toMatchObject({ offset: 32, span: 768 });

    // normal + no trigger: the last triggered window is held verbatim.
    const b = resolve(mkChunk(triggerless));
    expect(b).toBe(a);

    // auto + no trigger: free-runs the new chunk from sample 0.
    scope.trigger = "auto";
    const c = resolve(mkChunk(triggerless));
    expect(c).toMatchObject({ offset: 0, span: 768 });
    expect(c!.chunk).not.toBe(a!.chunk);

    // off: the raw full window.
    scope.trigger = "off";
    expect(resolve(mkChunk(periodic))).toMatchObject({ offset: 0, span: 1024 });
  });
});

describe("sc-strudel", () => {
  it("captures its text content as the initial pattern code", async () => {
    const host = await mountXml('<sc-strudel>s("bd hh*2")</sc-strudel>');
    const strudel = host.querySelector("sc-strudel") as ScStrudel;
    await strudel.updateComplete;
    expect(strudelMirrors).toHaveLength(1);
    expect(strudelMirrors[0].opts.initialCode).toBe('s("bd hh*2")');
    // The raw code text was cleared before the editor rendered.
    expect(strudel.querySelector(".strudel-editor")).not.toBeNull();
    expect(strudel.textContent).not.toContain('s("bd hh*2")');
  });

  it("stamps its orbit onto dirt events the pattern didn't route", async () => {
    const host = await mountXml('<sc-strudel orbit="2"></sc-strudel>');
    await (host.querySelector("sc-strudel") as ScStrudel).updateComplete;
    const out = strudelMirrors[0].opts.defaultOutput as (
      hap: { value: unknown }, d: number, du: number, cps: number, t: number,
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
      '"orbit" attribute must be a non-negative integer (got "-1")',
    );
  });
});
