// <sc-env-editor> gate: the writable-ARRAY target validation, the
// programmatic edit seam (pointer geometry is untestable under happy-dom —
// the drag handlers funnel into the same applyEdit/commit path), and the
// pure breakpoint edit helpers (insert/remove with flag preservation). The
// bound target is an ordinary array-valued control; edits encode to the same
// width and dispatch through the generic state write (/n_setn on the owning
// node — here the plugin group, which scsynth fans out).

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { OSC } from "@sc-app/server-commands";
import { registerScElements, type ScControl } from "@/sc-elements";
import { insertPoint, removePoint, type ScEnvEditor } from "@/sc-elements/inputs/sc-env-editor";
import type { EnvBreakpoints } from "@/lib/synthdef/envValue";
import { installScsynthMock, mountPlugin, wrapXml } from "@/lib/utils/test/test-utils";

let sent: OSC.Message[];

const ENV = "0, 2, 1, -99, 1, 0.01, 5, -4, 0, 0.3, 5, -4";

const PLUGIN = wrapXml(`<sc-control name="env" value="${ENV}"/>
  <sc-env-editor bind:value="env"/>`);

beforeAll(() => registerScElements());

beforeEach(() => {
  ({ sent } = installScsynthMock());
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("sc-env-editor", () => {
  it("decodes the bound array and commits a fresh same-width encoding", async () => {
    const { host } = await mountPlugin(PLUGIN);
    const editor = host.querySelector("sc-env-editor") as ScEnvEditor;
    const control = host.querySelector("sc-control") as ScControl;
    sent.length = 0;

    editor.applyEdit((v) => ({ ...v, start: 0.5 }));
    const state = control._state as number[];
    expect(Array.isArray(state)).toBe(true);
    expect(state).toHaveLength(12); // same width as the declared array
    expect(state[0]).toBe(0.5);
    // One /n_setn on the control's owning node (the plugin group).
    const setns = sent.filter((m) => m.address === "/n_setn");
    expect(setns).toHaveLength(1);
    expect(setns[0].args.slice(0, 3)).toEqual([host.nodeId, "env", 12]);
    expect(setns[0].args[3]).toBe(0.5);
  });

  it("rejects a scalar target and an expression bind", async () => {
    await expect(
      mountPlugin(wrapXml(`<sc-var name="x" value="1"/><sc-env-editor bind:value="x"/>`)),
    ).rejects.toThrow('"bind:value" must reference an ARRAY-valued control/var');
    document.body.replaceChildren();
    await expect(
      mountPlugin(wrapXml(`<sc-var name="x" value="1"/><sc-env-editor bind:value="x * 2"/>`)),
    ).rejects.toThrow('"bind:value" must reference a single writable envelope state');
  });

  it("rejects an array too narrow for a header + one segment", async () => {
    await expect(
      mountPlugin(wrapXml(`<sc-var name="x" value="1, 2, 3"/><sc-env-editor bind:value="x"/>`)),
    ).rejects.toThrow("envelope array needs at least 8 slots");
  });

  it("validates the breakpoint-count bounds (min ≥ 2, max ≥ min)", async () => {
    await expect(
      mountPlugin(
        wrapXml(`<sc-control name="env" value="${ENV}"/>
          <sc-env-editor bind:value="env" minbreakpoints="1"/>`),
      ),
    ).rejects.toThrow('"minbreakpoints" must be an integer ≥ 2');
    document.body.replaceChildren();
    await expect(
      mountPlugin(
        wrapXml(`<sc-control name="env" value="${ENV}"/>
          <sc-env-editor bind:value="env" minbreakpoints="4" maxbreakpoints="3"/>`),
      ),
    ).rejects.toThrow('"maxbreakpoints" must be an integer ≥ minbreakpoints');
    document.body.replaceChildren();
    await expect(
      mountPlugin(
        wrapXml(`<sc-control name="env" value="${ENV}"/>
          <sc-env-editor bind:value="env" minbreakpoints="3" maxbreakpoints="3"/>`),
      ),
    ).resolves.toBeTruthy(); // a LOCKED structure parses clean
  });

});

describe("breakpoint edit helpers", () => {
  const BASE: EnvBreakpoints = {
    start: 0,
    segments: [
      { to: 1, time: 0.1, curve: -4 },
      { to: 0.5, time: 0.2 },
      { to: 0, time: 0.3, release: true },
    ],
  };

  it("insertPoint splits a segment at the click, second half keeps the flags", () => {
    const next = insertPoint(BASE, 2, 0.1 + 0.2 + 0.1, 0.25); // inside segment 2
    expect(next.segments).toHaveLength(4);
    expect(next.segments[2]).toMatchObject({ to: 0.25 }); // the new point
    expect(next.segments[2].time).toBeCloseTo(0.1);
    expect(next.segments[3]).toMatchObject({ to: 0, release: true });
    expect(next.segments[3].time).toBeCloseTo(0.2);
    expect(next).not.toBe(BASE); // fresh object
  });

  it("removePoint merges adjoining segments, keeping the second's target", () => {
    const next = removePoint(BASE, 2); // remove the 0.5 breakpoint
    expect(next.segments).toHaveLength(2);
    expect(next.segments[1]).toMatchObject({ to: 0, release: true });
    expect(next.segments[1].time).toBeCloseTo(0.5); // 0.2 + 0.3
  });

  it("removing a MIDDLE release point moves the flag onto the merged segment", () => {
    const env: EnvBreakpoints = {
      start: 0,
      segments: [
        { to: 1, time: 0.1 },
        { to: 0.5, time: 0.2, release: true },
        { to: 0, time: 0.3 },
      ],
    };
    const out = removePoint(env, 2); // drop the release breakpoint itself
    expect(out.segments).toHaveLength(2);
    // The flag survives on the merged segment — a silently no-release
    // envelope would self-free voices at a nonzero level (click per note).
    expect(out.segments[1].release).toBe(true);
    expect(out.segments[1].time).toBeCloseTo(0.5, 6);
  });

  it("removing the release point moves the flag to the new last segment", () => {
    const next = removePoint(BASE, 3); // the release breakpoint itself
    expect(next.segments).toHaveLength(2);
    expect(next.segments[1].release).toBe(true);
  });
});
