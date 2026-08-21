// The watchdog suite drives connection state and inbound messages through the
// same public OscClient seams used in production, then advances its worker
// clock subscription with an injected `/clock/tick`.

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLOCK_SUBSCRIBE_ADDRESS,
  CLOCK_TICK_ADDRESS,
  type OscMessage,
} from "@sc-app/server-commands";
import { STATUS_REPLY_TIMEOUT_MS } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import { toasts } from "@/stores/toasts";
import { oscClient } from "../OscClient";
import { statusWatchdog } from "../watchdog";
import { workerClient } from "../worker/WorkerClient";

const oscMessage = (address: string, ...args: OscMessage["args"]): OscMessage => ({
  address,
  args,
});
const oscSlice = appStore.slice(SliceName.OSC);

beforeEach(() => {
  vi.useFakeTimers();
  vi.restoreAllMocks();
  oscSlice.update((s) => ({ ...s, connected: false }));
  appStore.slice(SliceName.TOASTS).set([]);
});

describe("StatusWatchdog", () => {
  it("closes after status replies miss the deadline", () => {
    const send = vi.spyOn(workerClient, "send");
    const close = vi.spyOn(oscClient, "close").mockImplementation(() => {});
    oscSlice.update((s) => ({ ...s, connected: true }));
    statusWatchdog.middleware.event!(
      { type: "osc", packet: oscMessage("/status.reply", 1, 0, 0, 0, 0, 0, 0, 48_000, 48_000) },
      () => {},
    );
    const subscribe = send.mock.calls
      .map(([packet]) => packet as OscMessage)
      .filter((packet) => packet.address === CLOCK_SUBSCRIBE_ADDRESS)
      .at(-1);
    expect(subscribe).toBeDefined();
    vi.advanceTimersByTime(STATUS_REPLY_TIMEOUT_MS + 1);
    oscClient.handleReply(oscMessage(CLOCK_TICK_ADDRESS, subscribe!.args[0], 1));
    expect(close).toHaveBeenCalledOnce();
    expect(toasts.get().at(-1)?.message).toMatch(/^\/status\.reply: /);
    oscSlice.update((s) => ({ ...s, connected: false }));
    vi.useRealTimers();
  });
});
