// Telemetry is tested through OscClient's public packet seams: inbound cases
// drive handleReply end-to-end, while outbound logging drives send. Importing
// the singleton pins its construction-on-import activation contract.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { SCOPE_CHUNK_ADDRESS, type OscMessage } from "@sc-app/server-commands";
import { MAX_LOG } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import { oscClient } from "../OscClient";
import { oscTelemetry } from "../telemetry";
import { workerClient } from "../worker/WorkerClient";
import { TRANSPORT_STATUS } from "../worker/transport";

const oscMessage = (address: string, ...args: OscMessage["args"]): OscMessage => ({
  address,
  args,
});
const oscSlice = appStore.slice(SliceName.OSC);

beforeEach(() => {
  vi.restoreAllMocks();
  oscSlice.update((s) => ({ ...s, log: [], errors: [], scsynthStatus: null, clock: null }));
});

describe("OscTelemetry", () => {
  it("logs an ordinary reply as rx", () => {
    oscClient.handleReply(oscMessage("/n_go", 1000, 1));
    expect(oscTelemetry.log.get()[0]).toMatchObject({
      dir: "rx",
      address: "/n_go",
      args: ["1000", "1"],
    });
  });

  it("keeps the log bounded to MAX_LOG, dropping the oldest", () => {
    for (let i = 0; i < MAX_LOG + 10; i++) oscClient.handleReply(oscMessage("/n_go", i));
    const log = oscTelemetry.log.get();
    expect(log).toHaveLength(MAX_LOG);
    expect(log[0].args).toEqual(["10"]);
    expect(log.at(-1)?.args).toEqual([String(MAX_LOG + 9)]);
  });

  it("routes /status.reply into scsynthStatus and keeps it out of the log", () => {
    oscClient.handleReply(oscMessage("/status.reply", 1, 0, 0, 0, 0, 12.5, 20.25, 48000, 48000));
    expect(oscTelemetry.scsynthStatus.get()).toEqual({
      avgCpu: 12.5,
      peakCpu: 20.25,
      sampleRate: 48000,
      numUgens: 0,
      numSynths: 0,
      numGroups: 0,
    });
    expect(oscTelemetry.log.get()).toHaveLength(0);
  });

  it("coalesces identical /fail banners and still logs them", () => {
    oscClient.handleReply(oscMessage("/fail", "/s_new", "SynthDef not found"));
    oscClient.handleReply(oscMessage("/fail", "/s_new", "SynthDef not found"));
    const errors = oscTelemetry.errors.get();
    expect(errors[0]).toMatchObject({
      address: "/s_new",
      message: "SynthDef not found",
      variant: "error",
      count: 2,
    });
    expect(oscTelemetry.log.get()).toHaveLength(2);
    oscTelemetry.dismissError(errors[0].id);
    expect(oscTelemetry.errors.get()).toHaveLength(0);
  });

  it("skips scope and clock traffic while mirroring clock status", () => {
    oscClient.handleReply(oscMessage(SCOPE_CHUNK_ADDRESS, 1, 0));
    oscClient.handleReply(oscMessage("/clock/tick", 1, 0));
    oscClient.handleReply(oscMessage("/clock/status", 12.5, 3));
    expect(oscTelemetry.log.get()).toHaveLength(0);
    expect(oscTelemetry.clock.get()).toEqual({ offset: 12.5, rtt: 3 });
  });

  it("resets load and banners when connect starts but preserves the log", async () => {
    oscSlice.update((s) => ({
      ...s,
      log: [{ id: 1, ts: 1, dir: "rx", address: "/kept", args: [] }],
      errors: [{ id: 2, ts: 1, address: "/fail", message: "old", variant: "error", count: 1 }],
      scsynthStatus: {
        avgCpu: 1,
        peakCpu: 2,
        sampleRate: 48000,
        numUgens: 3,
        numSynths: 4,
        numGroups: 5,
      },
    }));
    vi.spyOn(workerClient, "open").mockImplementation(() => {});
    const connecting = oscClient.connect("ws://test", {
      sessionGroupId: 1,
      nodeIdBase: 100,
      nodeIdCount: 100,
      scopeIndexBase: 0,
      scopeIndexCount: 8,
    });
    expect(oscTelemetry.log.get()).toHaveLength(1);
    expect(oscTelemetry.errors.get()).toEqual([]);
    expect(oscTelemetry.scsynthStatus.get()).toBeNull();
    (
      oscClient as unknown as { handleTransportEvent(event: { type: "close" }): void }
    ).handleTransportEvent({ type: "close" });
    await expect(connecting).rejects.toThrow("websocket closed before open");
  });

  it("logs outbound packets through send", () => {
    vi.spyOn(workerClient, "status").mockReturnValue(TRANSPORT_STATUS.IS_OPEN);
    vi.spyOn(workerClient, "send").mockImplementation(() => {});
    oscClient.send(oscMessage("/n_set", 1000, "freq", 440));
    expect(oscTelemetry.log.get()[0]).toMatchObject({
      dir: "tx",
      address: "/n_set",
      args: ["1000", "freq", "440"],
    });
  });
});
