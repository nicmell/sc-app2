/// <reference lib="webworker" />
// The Web Worker that owns the WebSocket, keeping socket traffic off the main
// thread. A dumb byte relay: open/send/close in, open/message/error/close out.
// No osc-js here — encode/decode live in the OscClient's plugin notify path.

import type { PluginToWorker, WorkerToPlugin } from "./protocol";

let ws: WebSocket | null = null;

const post = (msg: WorkerToPlugin, transfer?: Transferable[]) =>
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg, { transfer });

self.onmessage = (ev: MessageEvent<PluginToWorker>) => {
  const msg = ev.data;
  switch (msg.type) {
    case "open": {
      console.log("[sc:transport] opening ws", msg.url);
      ws = new WebSocket(msg.url);
      ws.binaryType = "arraybuffer";
      ws.onopen = () => {
        console.log("[sc:transport] ws open");
        post({ type: "open" });
      };
      ws.onmessage = (e) => {
        // Transfer the frame's buffer so the main thread owns it zero-copy.
        // Ignore text frames — the bridge only sends binary.
        if (e.data instanceof ArrayBuffer) post({ type: "message", data: e.data }, [e.data]);
      };
      ws.onerror = () => {
        console.error("[sc:transport] ws error");
        post({ type: "error", message: "websocket error" });
      };
      ws.onclose = (e) => {
        console.warn("[sc:transport] ws close", e.code, e.reason || "(no reason)");
        post({ type: "close" });
      };
      return;
    }
    case "send": {
      if (!ws) {
        post({ type: "error", message: "send before open" });
        return;
      }
      ws.send(msg.data);
      return;
    }
    case "close": {
      ws?.close();
      ws = null;
      return;
    }
  }
};
