// OscClient telemetry unit test: drives the public handleReply (normally fed
// by the client's `*` subscription) and asserts the osc slice it owns — the
// bounded rx log, the /status.reply routing, the /fail banner coalescing, and
// the /scope/chunk console skip. The connect/watchdog path needs a live
// worker and is covered by the manual smoke instead.
//
// Importing OscClient is side-effect-free here: the WS worker only spawns
// inside connect(), which is never called in this file.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLOCK_SUBSCRIBE_ADDRESS,
  CLOCK_TICK_ADDRESS,
  type OscMessage,
  formatOscArg,
  SCOPE_CHUNK_ADDRESS,
  Synced,
} from "@sc-app/server-commands";
import { MAX_LOG, REPLY_TIMEOUT_MS, STATUS_REPLY_TIMEOUT_MS } from "@/constants/osc";
import { oscClient } from "@/lib/osc/OscClient";
import { workerClient } from "@/lib/osc/worker/WorkerClient";
import { appStore } from "@/stores/store";
import { SliceName } from "@/constants/store";

const oscMessage = (address: string, ...args: OscMessage["args"]): OscMessage => ({
  address,
  args,
});

const oscSlice = appStore.slice(SliceName.OSC);

beforeEach(() => {
  oscSlice.update((s) => ({ ...s, log: [], errors: [], scsynthStatus: null }));
});

describe("OscClient.handleReply", () => {
  it("logs an ordinary reply as rx", () => {
    oscClient.handleReply(oscMessage("/n_go", 1000, 1));
    const log = oscClient.log.get();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ dir: "rx", address: "/n_go", args: ["1000", "1"] });
  });

  it("keeps the log bounded to MAX_LOG, dropping the oldest", () => {
    for (let i = 0; i < MAX_LOG + 10; i++) {
      oscClient.handleReply(oscMessage("/n_go", i));
    }
    const log = oscClient.log.get();
    expect(log).toHaveLength(MAX_LOG);
    expect(log[0].args).toEqual(["10"]);
    expect(log[log.length - 1].args).toEqual([String(MAX_LOG + 9)]);
  });

  it("routes /status.reply into scsynthStatus and keeps it out of the log", () => {
    oscClient.handleReply(oscMessage("/status.reply", 1, 0, 0, 0, 0, 12.5, 20.25, 48000, 48000.0));
    expect(oscClient.scsynthStatus.get()).toEqual({
      avgCpu: 12.5,
      peakCpu: 20.25,
      sampleRate: 48000,
      numUgens: 0,
      numSynths: 0,
      numGroups: 0,
    });
    expect(oscClient.log.get()).toHaveLength(0);
  });

  it("coalesces identical /fail banners and still logs them; dismissError drops one", () => {
    const fail = () => oscMessage("/fail", "/s_new", "SynthDef not found");
    oscClient.handleReply(fail());
    oscClient.handleReply(fail());
    const errors = oscClient.errors.get();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      address: "/s_new",
      message: "SynthDef not found",
      variant: "error",
      count: 2,
    });
    // Both occurrences still land in the console log.
    expect(oscClient.log.get()).toHaveLength(2);
    oscClient.dismissError(errors[0].id);
    expect(oscClient.errors.get()).toHaveLength(0);
  });

  it("skips /scope/chunk in the console log", () => {
    oscClient.handleReply(oscMessage(SCOPE_CHUNK_ADDRESS, 1, 0));
    expect(oscClient.log.get()).toHaveLength(0);
  });

  it("dispatches /clock/tick by id and keeps clock traffic out of the log", () => {
    const cb = vi.fn();
    const sub = oscClient.subscribeClock(100, cb);
    oscClient.handleReply(oscMessage(CLOCK_TICK_ADDRESS, sub.id, 1));
    expect(cb).toHaveBeenCalledTimes(1);
    expect(oscClient.log.get()).toHaveLength(0);
    sub.off();
  });

  it("mirrors /clock/status and applies its Date.now offset", () => {
    vi.spyOn(Date, "now").mockReturnValue(10_000);
    oscClient.handleReply(oscMessage("/clock/status", 12.5, 3));
    expect(oscClient.clock.get()).toEqual({ offset: 12.5, rtt: 3 });
    expect(oscClient.clockNow()).toBe(10_012.5);
  });
});

describe("OscClient clock lifecycle", () => {
  it("replays subscriptions after worker respawn", () => {
    const send = vi.spyOn(workerClient, "send");
    const sub = oscClient.subscribeClock(250, () => {});
    send.mockClear();
    (
      oscClient as unknown as { handleTransportEvent(event: { type: "respawn" }): void }
    ).handleTransportEvent({ type: "respawn" });
    expect(send).toHaveBeenCalledWith({
      address: CLOCK_SUBSCRIBE_ADDRESS,
      args: [sub.id, 250],
    });
    sub.off();
  });

  it("closes from watchdog ticks after the status deadline", () => {
    vi.useFakeTimers();
    const send = vi.spyOn(workerClient, "send");
    const close = vi.spyOn(oscClient, "close").mockImplementation(() => {});
    appStore.slice(SliceName.OSC).update((s) => ({ ...s, connected: true }));
    oscClient.handleReply(oscMessage("/status.reply", 1, 0, 0, 0, 0, 0, 0, 48_000, 48_000));
    (oscClient as unknown as { armWatchdog(): void }).armWatchdog();
    const subscribes = send.mock.calls
      .map(([packet]) => packet as OscMessage)
      .filter((packet) => packet.address === CLOCK_SUBSCRIBE_ADDRESS);
    const subscribe = subscribes[subscribes.length - 1];
    vi.advanceTimersByTime(STATUS_REPLY_TIMEOUT_MS + 1);
    oscClient.handleReply(oscMessage(CLOCK_TICK_ADDRESS, subscribe.args[0], 1));
    expect(close).toHaveBeenCalledOnce();
    (oscClient as unknown as { disarmWatchdog(): void }).disarmWatchdog();
    appStore.slice(SliceName.OSC).update((s) => ({ ...s, connected: false }));
    vi.useRealTimers();
  });
});

describe("OscClient.once", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves on the first matching reply, which still reaches the console log", async () => {
    const reply = oscClient.once("/synced", (m) => Synced.syncId(m) === 7);
    oscClient.handleReply(oscMessage("/synced", 7));
    const msg = await reply;
    expect(msg.args).toEqual([7]);
    expect(oscClient.log.get()).toHaveLength(1);
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

  it("rejects pending waiters when the connection closes", async () => {
    const reply = oscClient.once("/synced");
    const expectation = expect(reply).rejects.toThrow("OscClient.once: connection closed");
    oscClient.close();
    await expectation;
  });
});

describe("OscClient.createSynth", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("frees the allocated node when the /n_go ack times out (no untracked drones)", async () => {
    const sent: OscMessage[] = [];
    vi.spyOn(oscClient, "send").mockImplementation((p) => sent.push(p as OscMessage));
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

describe("OscClient.setControln", () => {
  it("sends /n_setn with the named contiguous run", () => {
    const sent: OscMessage[] = [];
    vi.spyOn(oscClient, "send").mockImplementation((p) => sent.push(p as OscMessage));
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
