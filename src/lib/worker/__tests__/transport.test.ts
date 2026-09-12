// The byte Transport: socket lifecycle and raw frame relay — against a
// scripted WebSocket stub (the codec lives in the endpoint; see
// endpoint.test.ts and codec.test.ts).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRANSPORT_STATUS } from "@/constants/osc";
import { Transport, type WireEvent } from "../transport";

class WsStub {
  static instances: WsStub[] = [];
  binaryType = "";
  readyState = 0;
  closed = false;
  sent: Uint8Array[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((e: { code?: number; reason?: string }) => void) | null = null;

  constructor(public url: string) {
    WsStub.instances.push(this);
  }

  send(data: Uint8Array): void {
    this.sent.push(data);
  }

  close(): void {
    this.closed = true;
    this.readyState = TRANSPORT_STATUS.IS_CLOSED;
  }
}

let events: WireEvent[] = [];
let transport: Transport;

beforeEach(() => {
  vi.stubGlobal("WebSocket", WsStub);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  WsStub.instances = [];
  events = [];
  transport = new Transport();
  transport.onEvent((event) => events.push(event));
});

afterEach(() => vi.unstubAllGlobals());

describe("Transport", () => {
  it("silently disposes the previous socket on reopen", () => {
    transport.open("ws://a");
    const first = WsStub.instances[0];
    transport.open("ws://b");
    expect(first.closed).toBe(true);
    expect(first.onopen).toBeNull();
    expect(first.onclose).toBeNull();
    expect(WsStub.instances).toHaveLength(2);
    expect(events).toHaveLength(0);
  });

  it("emits nothing on orderly close", () => {
    transport.open("ws://a");
    transport.close();
    expect(WsStub.instances[0].closed).toBe(true);
    expect(events).toHaveLength(0);
  });

  it("reports send before open as an error event, relays bytes after it", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    transport.send(bytes);
    expect(events).toEqual([{ type: "error", message: "send before open" }]);

    transport.open("ws://a");
    transport.send(bytes);
    expect(WsStub.instances[0].sent).toEqual([bytes]);
  });

  it("relays binary frames raw and ignores text, plus open/error/close", () => {
    transport.open("ws://a");
    const ws = WsStub.instances[0];
    const buffer = new Uint8Array([1, 2]).slice().buffer;
    ws.onopen?.();
    ws.onmessage?.({ data: "text frame" });
    ws.onmessage?.({ data: buffer });
    ws.onerror?.();
    ws.onclose?.({ code: 1006, reason: "" });
    expect(events).toEqual([
      { type: "open" },
      { type: "data", data: buffer },
      { type: "error", message: "websocket error" },
      { type: "close", code: 1006, reason: undefined },
    ]);
  });
});
