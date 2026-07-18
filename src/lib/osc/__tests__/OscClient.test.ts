// OscClient telemetry unit test: drives the public handleReply (normally fed
// by the transport's decode loop) with typed ServerReply fixtures and asserts
// the osc slice it owns — the bounded rx log, the status-reply routing, the
// fail banner coalescing, and the scope-chunk console skip. The
// connect/watchdog path needs a live worker and is covered by the manual
// smoke instead.
//
// Importing OscClient is side-effect-free apart from instantiating the wasm
// component it encodes/decodes with: the WS worker only spawns inside
// connect(), which is never called in this file.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatOscArg, type ServerReply } from "@sc-app/server-commands";
import { MAX_LOG, REPLY_TIMEOUT_MS } from "@/constants/osc";
import { oscClient } from "@/lib/osc/OscClientProxy";
import { OscClient } from "@/lib/osc/worker/OscClient";
import { TRANSPORT_STATUS } from "@/lib/osc/worker/transport";
import { workerOscClient } from "@/lib/utils/test/osc-endpoint";
import { flat, nGoReply, type SentMessage } from "@/lib/utils/test/test-utils";
import { appStore } from "@/stores/store";
import { SliceName } from "@/constants/store";

const oscSlice = appStore.slice(SliceName.OSC);

const syncedReply = (syncId: number): ServerReply => ({ address: "/synced", syncId });

beforeEach(() => {
  oscSlice.update((s) => ({ ...s, log: [], errors: [], scsynthStatus: null }));
});

describe("OscClient.handleReply", () => {
  it("logs an ordinary reply as rx", async () => {
    workerOscClient.handleReply(nGoReply(1000));
    await Promise.resolve();
    const log = oscClient.log.get();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      dir: "rx",
      address: "/n_go",
      args: ["1000", "1", "-1", "-1", "0"],
    });
  });

  it("keeps the log bounded to MAX_LOG, dropping the oldest", async () => {
    for (let i = 0; i < MAX_LOG + 10; i++) {
      workerOscClient.handleReply(nGoReply(i));
    }
    await Promise.resolve();
    const log = oscClient.log.get();
    expect(log).toHaveLength(MAX_LOG);
    expect(log[0].args[0]).toBe("10");
    expect(log[log.length - 1].args[0]).toBe(String(MAX_LOG + 9));
  });

  it("routes status-reply into scsynthStatus and keeps it out of the log", () => {
    workerOscClient.handleReply({
      address: "/status.reply",
      unused: 1,
      numUgens: 0,
      numSynths: 0,
      numGroups: 0,
      numSynthDefs: 0,
      avgCpu: 12.5,
      peakCpu: 20.25,
      nominalSampleRate: 48000,
      actualSampleRate: 48000.0,
    });
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

  it("coalesces identical fail banners and still logs them; dismissError drops one", async () => {
    const fail = (): ServerReply => ({
      address: "/fail",
      command: "/s_new",
      error: "SynthDef not found",
      extras: [],
    });
    workerOscClient.handleReply(fail());
    workerOscClient.handleReply(fail());
    await Promise.resolve();
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

  it("skips scope chunks in the console log", () => {
    workerOscClient.handleReply({
      address: "/scope/chunk",
      subId: 1,
      tickIndex: 0,
      isGap: false,
      channels: 1,
      samples: Float32Array.of(0),
    });
    expect(oscClient.log.get()).toHaveLength(0);
  });
});

describe("OscClient.once", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves on the first matching reply, which still reaches the console log", async () => {
    const reply = workerOscClient.once("/synced", (s) => s.syncId === 7);
    workerOscClient.handleReply(syncedReply(7));
    const val = await reply;
    expect(val.syncId).toBe(7);
    expect(oscClient.log.get()).toHaveLength(1);
  });

  it("ignores non-matching replies and is one-shot FIFO per match", async () => {
    const first = workerOscClient.once("/n_go", (n) => n.nodeId === 100);
    const second = workerOscClient.once("/n_go", (n) => n.nodeId === 100);
    workerOscClient.handleReply(nGoReply(99));
    workerOscClient.handleReply(nGoReply(100));
    await expect(first).resolves.toMatchObject({ nodeId: 100 });
    // The second waiter is still pending — only one waiter consumed the reply.
    workerOscClient.handleReply(nGoReply(100));
    await expect(second).resolves.toMatchObject({ nodeId: 100 });
  });

  it("rejects after the reply timeout", async () => {
    vi.useFakeTimers();
    const reply = workerOscClient.once("/synced", (s) => s.syncId === 8);
    const expectation = expect(reply).rejects.toThrow(
      "OscClient.once: timed out waiting for /synced",
    );
    vi.advanceTimersByTime(REPLY_TIMEOUT_MS);
    await expectation;
    // A late reply after the timeout matches nothing (the waiter is gone).
    workerOscClient.handleReply(syncedReply(8));
  });

  it("rejects pending waiters when the connection closes", async () => {
    const reply = workerOscClient.once("/synced");
    const expectation = expect(reply).rejects.toThrow("OscClient.once: connection closed");
    workerOscClient.close();
    await expectation;
  });
});

describe("OscClient.connect", () => {
  it("rejects a connect still awaiting open when close() lands first", async () => {
    // A connecting transport that never opens: close() is the only way the
    // pending connect can settle (the disposed socket emits no close event).
    const transport = {
      open: () => {},
      close: () => {},
      send: () => {},
      onEvent: () => {},
      status: () => TRANSPORT_STATUS.IS_CONNECTING,
    };
    const client = new OscClient(undefined, transport);
    const connecting = client.connect("ws://test", {
      sessionGroupId: 1,
      nodeIdBase: 1000,
      nodeIdCount: 100,
      scopeIndexBase: 0,
      scopeIndexCount: 8,
    });
    const expectation = expect(connecting).rejects.toThrow("websocket closed before open");
    client.close();
    await expectation;
  });
});

describe("OscClient.createSynth", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("frees the allocated node when the /n_go ack times out (no untracked drones)", async () => {
    const sent: SentMessage[] = [];
    vi.spyOn(workerOscClient, "send").mockImplementation((msg) => sent.push(flat(msg)));
    vi.spyOn(workerOscClient, "nextNodeId").mockImplementation(() => 4242);
    vi.useFakeTimers();
    const create = workerOscClient.createSynth("sine", 1, { freq: 440 });
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
    const sent: SentMessage[] = [];
    vi.spyOn(workerOscClient, "send").mockImplementation((msg) => sent.push(flat(msg)));
    workerOscClient.setControln(2001, "shape", [0, 3, 2, -99, 1, 0.5]);
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
