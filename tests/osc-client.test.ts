// OscClient telemetry unit test: drives the public handleReply (normally fed
// by the client's `*` subscription) and asserts the osc slice it owns — the
// bounded rx log, the /status.reply routing, the /fail banner coalescing, and
// the /scope/chunk console skip. The connect/watchdog path needs a live
// worker and is covered by the manual smoke instead.
//
// Importing OscClient is side-effect-free here: the WS worker only spawns
// inside connect(), which is never called in this file.

import { beforeEach, describe, expect, it } from "vitest";
import { OSC, formatOscArg, SCOPE_CHUNK_ADDRESS } from "@sc-app/server-commands";
import { MAX_LOG } from "@/constants/osc";
import { oscClient } from "@/lib/osc/OscClient";
import { appStore } from "@/stores/store";
import { SliceName } from "@/constants/store";

const oscSlice = appStore.slice(SliceName.OSC);

beforeEach(() => {
  oscSlice.update((s) => ({ ...s, log: [], errors: [], scsynthStatus: null }));
});

describe("OscClient.handleReply", () => {
  it("logs an ordinary reply as rx", () => {
    oscClient.handleReply(new OSC.Message("/n_go", 1000, 1));
    const log = oscClient.log.get();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ dir: "rx", address: "/n_go", args: ["1000", "1"] });
  });

  it("keeps the log bounded to MAX_LOG, dropping the oldest", () => {
    for (let i = 0; i < MAX_LOG + 10; i++) {
      oscClient.handleReply(new OSC.Message("/n_go", i));
    }
    const log = oscClient.log.get();
    expect(log).toHaveLength(MAX_LOG);
    expect(log[0].args).toEqual(["10"]);
    expect(log[log.length - 1].args).toEqual([String(MAX_LOG + 9)]);
  });

  it("routes /status.reply into scsynthStatus and keeps it out of the log", () => {
    oscClient.handleReply(
      new OSC.Message("/status.reply", 1, 0, 0, 0, 0, 12.5, 20.25, 48000, 48000.0),
    );
    expect(oscClient.scsynthStatus.get()).toEqual({
      avgCpu: 12.5,
      peakCpu: 20.25,
      sampleRate: 48000,
    });
    expect(oscClient.log.get()).toHaveLength(0);
  });

  it("coalesces identical /fail banners and still logs them; dismissError drops one", () => {
    const fail = () => new OSC.Message("/fail", "/s_new", "SynthDef not found");
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
    oscClient.handleReply(new OSC.Message(SCOPE_CHUNK_ADDRESS, 1, 0));
    expect(oscClient.log.get()).toHaveLength(0);
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
