// The worker-side runtime, written once for every environment. It owns the
// OSC bridge (WebSocket + decode) and bridges the worker message channel ↔ that
// bridge: inbound MainToWorker commands drive connect/send/disconnect; the
// bridge's callbacks are posted back as WorkerToMain.
//
// The channel is a MessageEndpoint with the params flipped from the client's
// WorkerHandle (it posts WorkerToMain and receives MainToWorker), so the browser
// (`self`) and Node (`parentPort`) entries differ only in a ~10-line inline
// endpoint.

import { createOscBridge, type OscBridge } from "./bridge";
import type { MainToWorker, WorkerToMain } from "../types/protocol";
import type { MessageEndpoint } from "./messageEndpoint";

/** Wire a worker endpoint to a fresh OSC bridge. Call once at worker entry. */
export function runOscWorker(port: MessageEndpoint<WorkerToMain, MainToWorker>): void {
  let bridge: OscBridge | null = null;
  const post = (msg: WorkerToMain, transfer?: Transferable[]) => port.postMessage(msg, transfer);

  async function handle(msg: MainToWorker): Promise<void> {
    switch (msg.type) {
      case "connect": {
        bridge = createOscBridge(msg.url, {
          onReply: (reply) => post({ type: "reply", reply }),
          // Transfer the chunk's buffer so the main thread owns it zero-copy.
          onScopeChunk: (chunk) => post({ type: "scopeChunk", chunk }, [chunk.data.buffer]),
          onError: (message) => post({ type: "error", message }),
          onClose: () => post({ type: "closed" }),
        });
        try {
          await bridge.ready;
          post({ type: "ready" });
        } catch (err) {
          post({ type: "error", message: err instanceof Error ? err.message : String(err) });
        }
        return;
      }
      case "send": {
        if (!bridge) {
          post({ type: "error", message: "send before connect" });
          return;
        }
        bridge.send(msg.bytes);
        return;
      }
      case "disconnect": {
        if (bridge) {
          await bridge.close();
          bridge = null;
        }
        return;
      }
    }
  }

  port.onMessage((msg) => {
    void handle(msg);
  });
}
