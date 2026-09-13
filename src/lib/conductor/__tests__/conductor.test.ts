// The Conductor's state machine and musical time: /n_run sequences,
// the cycle/seconds position math on a mocked audio timebase, tempo
// re-anchoring, and the disconnect reset. The Strudel seam lives with
// the widget (widgets.test.ts); the DOM here has no hosts, so the
// plugin/strudel enumerations are the empty case.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SliceName } from "@/constants/store";
import { conductor } from "@/lib/conductor/Conductor";
import { oscClient } from "@/lib/osc/OscClient";
import { appStore } from "@/stores/store";

const slice = appStore.slice(SliceName.CONDUCTOR);
const osc = appStore.slice(SliceName.OSC);

function connect(): void {
  oscClient.armSession({
    clientId: 1,
    sessionGroupId: 77,
    nodeIdBase: 100,
    nodeIdCount: 100,
    scopeIndexBase: 0,
    scopeIndexCount: 4,
  });
  osc.update((s) => ({ ...s, connected: true }));
}

describe("Conductor", () => {
  let audioNow = 0;

  beforeEach(() => {
    audioNow = 100;
    vi.spyOn(oscClient.clock, "audioTime").mockImplementation(() => audioNow);
    vi.spyOn(oscClient, "setNodeRun").mockImplementation(() => {});
    slice.update((s) => ({ ...s, cps: 0.5 })); // the tempo survives resets by design
    connect();
  });
  afterEach(() => {
    osc.update((s) => ({ ...s, connected: false }));
    vi.restoreAllMocks();
  });

  it("play runs the group and the position advances at cps cycles/second", async () => {
    await conductor.play();
    expect(oscClient.setNodeRun).toHaveBeenLastCalledWith(77, 1);
    expect(slice.get().state).toBe("playing");

    audioNow += 4; // 4 s at cps 0.5 → 2 cycles
    expect(conductor.cycle()).toBeCloseTo(2, 6);
    expect(conductor.seconds()).toBeCloseTo(4, 6);
  });

  it("pause freezes the position; play resumes from the same point", async () => {
    await conductor.play();
    audioNow += 4;
    conductor.pause();
    expect(oscClient.setNodeRun).toHaveBeenLastCalledWith(77, 0);
    expect(slice.get().state).toBe("paused");

    audioNow += 10; // time passes, position must not
    expect(conductor.cycle()).toBeCloseTo(2, 6);

    await conductor.play();
    audioNow += 2; // one more cycle
    expect(conductor.cycle()).toBeCloseTo(3, 6);
    expect(conductor.seconds()).toBeCloseTo(6, 6);
  });

  it("a tempo change re-anchors: slope changes, position does not jump", async () => {
    await conductor.play();
    audioNow += 4; // 2 cycles at 0.5
    conductor.setCps(1);
    expect(conductor.cycle()).toBeCloseTo(2, 6);
    audioNow += 2; // 2 more cycles at cps 1
    expect(conductor.cycle()).toBeCloseTo(4, 6);
    expect(conductor.seconds()).toBeCloseTo(6, 6); // seconds unaffected by tempo
  });

  it("rejects a non-positive or non-finite tempo", () => {
    conductor.setCps(0);
    conductor.setCps(-1);
    conductor.setCps(Number.NaN);
    expect(conductor.cps).toBe(0.5);
  });

  it("stop pauses the group and rewinds to zero", async () => {
    await conductor.play();
    audioNow += 4;
    conductor.stop();
    expect(oscClient.setNodeRun).toHaveBeenLastCalledWith(77, 0);
    expect(slice.get()).toMatchObject({ state: "stopped", cycleBase: 0, secondsBase: 0 });
    expect(conductor.cycle()).toBe(0);
  });

  it("disconnect resets to idle but keeps the session tempo", async () => {
    conductor.setCps(0.6);
    await conductor.play();
    audioNow += 4;
    osc.update((s) => ({ ...s, connected: false }));
    expect(slice.get()).toMatchObject({ state: "stopped", cycleBase: 0, anchorAudioTime: null });
    expect(conductor.cps).toBe(0.6);
  });
});
