import type { TransportEvent } from "@/types/osc";

export const TRANSPORT_STATUS = {
  IS_NOT_INITIALIZED: -1,
  IS_CONNECTING: 0,
  IS_OPEN: 1,
  IS_CLOSING: 2,
  IS_CLOSED: 3,
} as const;
export type TransportStatus = (typeof TRANSPORT_STATUS)[keyof typeof TRANSPORT_STATUS];
export interface WorkerTransport {
  open(url: string): void;
  close(): void;
  send(data: Uint8Array): void;
  onEvent(cb: (msg: TransportEvent) => void): void;
  status(): TransportStatus;
}

/** The deliberately small, worker-local raw WebSocket transport. */
export function createWsTransport(): WorkerTransport {
  let ws: WebSocket | null = null;
  let notify: (msg: TransportEvent) => void = () => {};
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
