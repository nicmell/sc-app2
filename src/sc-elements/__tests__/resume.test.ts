// Per-session plugin-state resume: the claim-and-consume seam
// (ScState.resolveRuntime over ctx.resumed), the id index + harvest
// (ScPlugin.stateIndex / collectPresets), and the load pass keeping a claimed
// value over the declarative default. The property under test is faithfulness
// by construction: only claimed entries ever reach the store, so a persisted
// snapshot can never carry a value nothing claims.

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { parseEntry } from "@/lib/plugins/PluginManager";
import { registerScElements, type ScPlugin, type ScVar } from "@/sc-elements";
import type { StateValue } from "@/types/runtime";
import { installScsynthMock, parsePlugin, wrapXml } from "@/lib/utils/test/test-utils";

beforeAll(() => {
  registerScElements();
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

const MARKUP = wrapXml(`
  <sc-var name="gain" value="1"/>
  <sc-group name="g1"><sc-var name="freq" value="440"/></sc-group>
  <sc-var name="lvl" bind:value="gain * 2"/>
`);

const varEl = (host: ScPlugin, name: string) =>
  host.querySelector(`sc-var[name="${name}"]`) as ScVar;

/** parsePlugin with resumed values installed before processRoot — the
 *  production seam (loadPluginHost) in miniature. */
function parseWithResumed(resumed: Record<string, StateValue>): ScPlugin {
  const host = parseEntry(MARKUP);
  host.resumed = resumed;
  host.processRoot();
  return host;
}

/** The stable ids of the fixture's elements (unseeded parse). */
function fixtureIds(): { gain: string; freq: string; lvl: string } {
  const { host } = parsePlugin(MARKUP);
  return { gain: varEl(host, "gain").id, freq: varEl(host, "freq").id, lvl: varEl(host, "lvl").id };
}

describe("per-session state resume", () => {
  it("claims resumed values into the store and consumes the map", () => {
    const ids = fixtureIds();
    const host = parseWithResumed({ [ids.gain]: 0.5, [ids.freq]: 880 });

    // Claims land under the elements' store keys BEFORE any load pass...
    expect(host.runtime.get()).toEqual({ gain: 0.5, "g1.freq": 880 });
    // ...and the map is consumed — a re-resolution can't re-apply it.
    expect(host.resumed).toBeUndefined();
  });

  it("drops unclaimed orphans with a warning, never touching the store", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = parseWithResumed({ deadbeef00000: 7 });

    expect(host.runtime.get()).toEqual({});
    expect(host.collectPresets()).toEqual({});
    expect(warn).toHaveBeenCalledOnce();
  });

  it("derived state neither registers nor claims", () => {
    const ids = fixtureIds();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = parseWithResumed({ [ids.lvl]: 9 });

    expect(host.stateIndex.has(ids.lvl)).toBe(false);
    expect(host.stateIndex.has(ids.gain)).toBe(true);
    expect(host.runtime.get()).toEqual({});
    expect(warn).toHaveBeenCalledOnce(); // the derived entry is an orphan
  });

  it("graph-plane state stays out of the index (never harvested)", () => {
    const { host } = parsePlugin(
      wrapXml(`<sc-synthdef name="d"><sc-control name="p" value="1"/></sc-synthdef>`),
    );

    expect(host.stateIndex.size).toBe(0);
  });

  it("collectPresets snapshots the store by id with debug paths", () => {
    const { host } = parsePlugin(MARKUP);
    const ids = fixtureIds();
    varEl(host, "gain").setValue(0.25);

    expect(host.collectPresets()).toEqual({ [ids.gain]: { path: "gain", value: 0.25 } });
  });

  it("a claimed value survives the load pass; the rest seed their defaults", async () => {
    installScsynthMock();
    const ids = fixtureIds();
    const host = parseWithResumed({ [ids.freq]: 880 });
    document.body.appendChild(host);
    await host.updateComplete;
    await host.load();

    expect(host.runtime.get()).toEqual({ gain: 1, "g1.freq": 880 });
    expect(host.collectPresets()).toEqual({
      [ids.gain]: { path: "gain", value: 1 },
      [ids.freq]: { path: "g1.freq", value: 880 },
    });
  });
});
