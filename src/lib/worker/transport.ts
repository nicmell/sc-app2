// The raw WebSocket transport for packed OSC frames, behind the shared
// `{ open, close, send, onMessage, status }` interface. This runs INSIDE the
// Web Worker (worker.ts calls `createWsTransport()` directly); the main
// thread talks to it through the WorkerClient, which exposes the same
// interface across the postMessage boundary. No osc-js here.

import type { TransportEvent } from "@/types/osc";

/** Connection states. The numbering deliberately mirrors WebSocket
 *  `readyState` — and therefore `OSC.STATUS` — plus -1 for "never opened",
 *  so the osc-js plugin can return it from `status()` verbatim. */
export const TRANSPORT_STATUS = {
  IS_NOT_INITIALIZED: -1,
  IS_CONNECTING: 0,
  IS_OPEN: 1,
  IS_CLOSING: 2,
  IS_CLOSED: 3,
} as const;

/** A transport for packed OSC frames — implemented by the raw WebSocket
 *  (`createWsTransport`, in the worker) and by its main-thread proxy
 *  (`createWorkerClient`). */
export interface OscTransport {
  /** Open the connection to `url`. */
  open(url: string): void;
  /** Close the connection. */
  close(): void;
  /** Relay one packed OSC frame. */
  send(data: Uint8Array): void;
  /** Register the consumer of transport events (one listener). */
  onMessage(cb: (msg: TransportEvent) => void): void;
  /** Connection status (a `TRANSPORT_STATUS` / `OSC.STATUS` value). */
  status(): number;
}

/** The WebSocket itself: open/send/close in, open/message/error/close out.
 *  The worker hosting it is permanent (the WorkerClient spawns it once), so
 *  connections come and go over this one transport: `open` silently disposes
 *  a previous socket, and an orderly `close` emits no event — the client
 *  synthesizes the single close signal, so a stale close can never arrive
 *  after a new connection's subscribers are in place. */
export function createWsTransport(): OscTransport {
  let ws: WebSocket | null = null;
  let notify: (msg: TransportEvent) => void = () => {};

  /** Detach + close the current socket without emitting anything. */
  const dispose = () => {
    if (!ws) return;
    ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
    ws.close();
    ws = null;
  };

  return {
    open(url) {
      dispose();
      console.log("[sc:transport] opening ws", url);
      ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      ws.onopen = () => {
        console.log("[sc:transport] ws open");
        notify({ type: "open" });
      };
      ws.onmessage = (e) => {
        // Ignore text frames — the bridge only sends binary.
        if (e.data instanceof ArrayBuffer) notify({ type: "message", data: e.data });
      };
      ws.onerror = () => {
        console.error("[sc:transport] ws error");
        notify({ type: "error", message: "websocket error" });
      };
      ws.onclose = (e) => {
        console.warn("[sc:transport] ws close", e.code, e.reason || "(no reason)");
        notify({ type: "close" });
      };
    },

    close() {
      dispose();
    },

    send(data) {
      if (!ws) {
        notify({ type: "error", message: "send before open" });
        return;
      }
      ws.send(data);
    },

    onMessage(cb) {
      notify = cb;
    },

    status() {
      // WebSocket readyState already uses the TRANSPORT_STATUS numbering.
      return ws ? ws.readyState : TRANSPORT_STATUS.IS_NOT_INITIALIZED;
    },
  };
}
