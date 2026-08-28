// SessionManager connection-lifecycle unit test: connect() against a mocked
// oscClient (no worker involved) — the loader-provided allocation reaches the
// client verbatim, the epoch guard abandons a connect superseded by
// disconnect() mid-await, and a transport failure flips the slice to "error".
// Session resolution (mint/revive/503 budget) is resolveSession.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionInfo } from "@/types/api";

const osc = vi.hoisted(() => ({
  connect: vi.fn(),
  close: vi.fn(),
  on: vi.fn(() => 1),
  off: vi.fn(),
  subscribeClock: vi.fn(() => ({ id: 1, off: vi.fn() })),
}));

vi.mock("@/lib/osc/OscClient", () => ({ oscClient: osc }));

import { SessionManager } from "@/lib/session/SessionManager";
import { layout } from "@/stores/layout";
import { presets } from "@/stores/presets";
import { appStore } from "@/stores/store";

const info: SessionInfo = {
  sessionId: "session-1",
  sessionGroupId: 10,
  nodeIdBase: 100,
  nodeIdCount: 20,
  scopeIndexBase: 2,
  scopeIndexCount: 4,
  scsynthAddress: "127.0.0.1:57110",
  data: { boxes: [], presets: {} },
};

beforeEach(() => {
  osc.connect.mockReset().mockResolvedValue(undefined);
  osc.close.mockReset();
  osc.on.mockClear();
  osc.off.mockClear();
  osc.subscribeClock.mockClear();
  appStore.update((state) => ({
    ...state,
    session: { status: "connecting", scsynthAddress: null },
  }));
});

afterEach(() => vi.restoreAllMocks());

describe("SessionManager", () => {
  it("connects using the loader-provided allocation and marks the session connected", async () => {
    const manager = new SessionManager();
    await manager.connect(info);

    expect(osc.connect).toHaveBeenCalledWith(expect.stringContaining("session=session-1"), {
      sessionGroupId: 10,
      nodeIdBase: 100,
      nodeIdCount: 20,
      scopeIndexBase: 2,
      scopeIndexCount: 4,
    });
    expect(manager.status.get()).toBe("connected");
    expect(manager.scsynthAddress.get()).toBe("127.0.0.1:57110");
    manager.disconnect();
  });

  it("ignores a pending connection after disconnect", async () => {
    let resolveConnect!: () => void;
    osc.connect.mockImplementation(
      () => new Promise<void>((resolve) => (resolveConnect = resolve)),
    );
    const manager = new SessionManager();
    const pending = manager.connect(info);
    manager.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 0)); // the deferred teardown fires
    resolveConnect();
    await pending;

    expect(manager.status.get()).toBe("connecting");
    expect(osc.close).toHaveBeenCalled();
  });

  it("keeps the standing connection across a StrictMode remount (same info)", async () => {
    const manager = new SessionManager();
    await manager.connect(info);
    manager.disconnect();
    await manager.connect(info); // remount cancels the deferred disconnect

    expect(osc.connect).toHaveBeenCalledTimes(1);
    expect(manager.status.get()).toBe("connected");
    // A NEW info object (loader re-run) does reconnect.
    await manager.connect({ ...info });
    expect(osc.connect).toHaveBeenCalledTimes(2);
    manager.disconnect();
  });

  it("resets the session data when a fresh session's data is empty", async () => {
    const manager = new SessionManager();
    const boxes = [{ i: "box-1", x: 0, y: 0, w: 4, h: 4, plugin: "p1" }];
    const boxPresets = {
      "box-1": { plugin: "p1", values: { abc123: { path: "gain", value: 0.5 } } },
    };
    await manager.connect({ ...info, data: { boxes, presets: boxPresets } });
    expect(layout.get()).toEqual(boxes);
    expect(presets.get()).toEqual(boxPresets);

    // Dead id → mint → redirect hands a fresh session with empty data:
    // the previous session's boxes and values must not survive onto it.
    await manager.connect({
      ...info,
      sessionId: "session-2",
      data: { boxes: [], presets: {} },
    });
    expect(layout.get()).toEqual([]);
    expect(presets.get()).toEqual({});
    manager.disconnect();
  });

  it("marks a failed active connection as an error", async () => {
    osc.connect.mockRejectedValue(new Error("socket failed"));
    const manager = new SessionManager();
    await manager.connect(info);
    expect(manager.status.get()).toBe("error");
  });
});
