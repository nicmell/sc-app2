// The raw socket layer under the worker's OscClient — nothing OSC-shaped
// here, just bytes and lifecycle events. `WorkerTransport` is the client's
// second constructor argument and thereby a test seam: OscClient.test.ts
// hands in stub transports to drive connect/close edges without a socket.

import type { TransportEvent } from "@/types/osc";

/** WebSocket readyState values plus a pre-`open()` sentinel — the client's
 *  send/close guards compare against these. */
export const TRANSPORT_STATUS = {
  IS_NOT_INITIALIZED: -1,
  IS_CONNECTING: 0,
  IS_OPEN: 1,
  IS_CLOSING: 2,
  IS_CLOSED: 3,
} as const;
export type TransportStatus = (typeof TRANSPORT_STATUS)[keyof typeof TRANSPORT_STATUS];

export interface WorkerTransport {
  /** Open (or re-open — any previous socket is disposed first) `url`. */
  open(url: string): void;
  close(): void;
  send(data: Uint8Array): void;
  /** Install THE event consumer (single-consumer, like ProtocolPort). */
  onEvent(cb: (msg: TransportEvent) => void): void;
  status(): TransportStatus;
}

/** The deliberately small, worker-local raw WebSocket transport. */
export function createWsTransport(): WorkerTransport {
  let ws: WebSocket | null = null;
  let notify: (msg: TransportEvent) => void = () => {};
  // Null the handlers BEFORE closing: a disposed socket must emit nothing —
  // the client relies on "no close event after an orderly close()" to avoid
  // double-notifying its subscribers.
  const dispose = () => {
    if (!ws) return;
    ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
    ws.close();
    ws = null;
  };
  return {
    open(url) {
      dispose();
      ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      ws.onopen = () => notify({ type: "open" });
      ws.onmessage = (e) => {
        if (e.data instanceof ArrayBuffer) notify({ type: "message", data: e.data });
      };
      ws.onerror = () => notify({ type: "error", message: "websocket error" });
      ws.onclose = (e) => notify({ type: "close", code: e.code, reason: e.reason || undefined });
    },
    close: dispose,
    send(data) {
      if (!ws) {
        notify({ type: "error", message: "send before open" });
        return;
      }
      ws.send(data);
    },
    onEvent(cb) {
      notify = cb;
    },
    status() {
      return (ws ? ws.readyState : TRANSPORT_STATUS.IS_NOT_INITIALIZED) as TransportStatus;
    },
  };
}
