// Importing the dispatch module is side-effect-free here: the WS worker only
// spawns inside connect(), which is never called in this file.

import { afterEach, describe, expect, it, vi } from "vitest";
import { type OscMessage, formatOscArg, Synced } from "@sc-app/server-commands";
import { REPLY_TIMEOUT_MS } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { oscClient } from "@/lib/osc/OscClient";
import { workerClient } from "@/lib/osc/WorkerClient";
import { appStore } from "@/stores/store";

const oscMessage = (address: string, ...args: OscMessage["args"]): OscMessage => ({
  address,
  args,
});

describe("oscClient.handleReply", () => {
  it("drives subscribeClock callbacks from the /clock/sample stream", () => {
    let now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const cb = vi.fn();
    const sub = oscClient.subscribeClock(100, cb);
    for (let i = 0; i < 4; i++) {
      now += 50; // the worker's sample cadence
      oscClient.handleReply(oscMessage("/clock/sample", 0, 1));
    }
    expect(cb).toHaveBeenCalledTimes(2); // 200 ms at a 100 ms interval
    sub.off();
  });

  it("folds /clock/sample into the estimate and applies its Date.now offset", () => {
    vi.spyOn(Date, "now").mockReturnValue(10_000);
    // rtt 0.5 beats any sample the singleton's window still holds.
    oscClient.handleReply(oscMessage("/clock/sample", 12.5, 0.5));
    expect(oscClient.clockNow()).toBe(10_012.5);
  });
});

describe("oscClient.once", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves on the first matching reply", async () => {
    const reply = oscClient.once("/synced", (m) => Synced.syncId(m) === 7);
    oscClient.handleReply(oscMessage("/synced", 7));
    const msg = await reply;
    expect(msg.args).toEqual([7]);
  });

  it("ignores non-matching replies and is one-shot FIFO per match", async () => {
    const first = oscClient.once("/n_go", (m) => m.args[0] === 100);
    const second = oscClient.once("/n_go", (m) => m.args[0] === 100);
    oscClient.handleReply(oscMessage("/n_go", 99, 1, -1, -1, 0));
    oscClient.handleReply(oscMessage("/n_go", 100, 1, -1, -1, 0));
    await expect(first).resolves.toMatchObject({ address: "/n_go" });
    // The second waiter is still pending — only one waiter consumed the reply.
    oscClient.handleReply(oscMessage("/n_go", 100, 1, -1, -1, 0));
    await expect(second).resolves.toMatchObject({ address: "/n_go" });
  });

  it("rejects after the reply timeout", async () => {
    vi.useFakeTimers();
    const reply = oscClient.once("/synced", (m) => Synced.syncId(m) === 8);
    const expectation = expect(reply).rejects.toThrow(
      "OscClient.once: timed out waiting for /synced",
    );
    vi.advanceTimersByTime(REPLY_TIMEOUT_MS);
    await expectation;
    // A late reply after the timeout matches nothing (the waiter is gone).
    oscClient.handleReply(oscMessage("/synced", 8));
  });

  it("drops connected and rejects pending waiters at the transport close seam", async () => {
    appStore.slice(SliceName.OSC).update((s) => ({ ...s, connected: true }));
    const reply = oscClient.once("/synced");
    const expectation = expect(reply).rejects.toThrow("OscClient.once: connection closed");
    oscClient.handleTransportEvent({ type: "close", reason: "remote close" });
    await expectation;
    expect(oscClient.connected.get()).toBe(false);
  });

  it("reports a worker crash as a close after respawn and error", () => {
    appStore.slice(SliceName.OSC).update((s) => ({ ...s, connected: true }));
    const events: string[] = [];
    const removeMiddleware = workerClient.use({
      event: (event, next) => {
        events.push(event.type);
        next(event);
      },
    });
    const close = vi.fn();
    const closeId = oscClient.on("close", close);
    const worker = (
      workerClient as unknown as { worker: Worker & { onerror: (event: ErrorEvent) => void } }
    ).worker;

    worker.onerror(new ErrorEvent("error", { message: "boom" }));

    expect(events).toEqual(["respawn", "error", "close"]);
    expect(oscClient.connected.get()).toBe(false);
    expect(close).toHaveBeenCalledWith({ type: "close", reason: "worker crashed" });
    oscClient.off("close", closeId);
    removeMiddleware();
  });
});

describe("oscClient.createSynth", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("frees the allocated node when the /n_go ack times out (no untracked drones)", async () => {
    const sent: OscMessage[] = [];
    vi.spyOn(oscClient, "dispatch").mockImplementation((p) => sent.push(p));
    vi.spyOn(oscClient, "nextNodeId").mockImplementation(() => 4242);
    vi.useFakeTimers();
    const create = oscClient.createSynth("sine", 1, { freq: 440 });
    const expectation = expect(create).rejects.toThrow("timed out");
    vi.advanceTimersByTime(REPLY_TIMEOUT_MS);
    await expectation;
    const sNew = sent.find((m) => m.address === "/s_new")!;
    const nodeId = sNew.args[1] as number;
    // The /s_new already went out — the catch must send the matching free.
    const nFree = sent.find((m) => m.address === "/n_free");
    expect(nFree?.args).toEqual([nodeId]);
  });
});

describe("oscClient.sendAt", () => {
  afterEach(() => vi.restoreAllMocks());

  it("stamps the bridge-time `at` metadata from a performance.now target", () => {
    vi.spyOn(Date, "now").mockReturnValue(10_000);
    // rtt 1 wins any earlier sample still in the window — offset 500 rules.
    oscClient.handleReply(oscMessage("/clock/sample", 500, 1));
    vi.spyOn(performance, "now").mockReturnValue(2_000);
    const dispatch = vi.spyOn(oscClient, "dispatch").mockImplementation(() => {});

    oscClient.sendAt({ address: "/dirt/play", args: [] }, 2_250);

    // clockNow (10_500) + atMs (2_250) − performance.now (2_000) = 10_750.
    expect(dispatch).toHaveBeenCalledWith({ address: "/dirt/play", args: [] }, 10_750);
  });
});

describe("oscClient.setControln", () => {
  it("sends /n_setn with the named contiguous run", () => {
    const sent: OscMessage[] = [];
    vi.spyOn(oscClient, "dispatch").mockImplementation((p) => sent.push(p));
    oscClient.setControln(2001, "shape", [0, 3, 2, -99, 1, 0.5]);
    expect(sent).toHaveLength(1);
    expect(sent[0].address).toBe("/n_setn");
    expect(sent[0].args).toEqual([2001, "shape", 6, 0, 3, 2, -99, 1, 0.5]);
  });
});

describe("formatOscArg", () => {
  it("renders binary args as a size tag, everything else via String", () => {
    expect(formatOscArg(new Uint8Array(64))).toBe("blob(64B)");
    expect(formatOscArg(new ArrayBuffer(8))).toBe("blob(8B)");
    expect(formatOscArg(440)).toBe("440");
    expect(formatOscArg("default")).toBe("default");
  });
});
