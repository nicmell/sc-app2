// The worker-side runtime: a generic byte relay, written once for every
// environment. It owns one WebSocket (via createOscTransport) and bridges the
// worker message channel ↔ that socket — connect/send/disconnect in, raw frames
// out. It knows nothing about OSC; encode/decode live on the main thread.
//
// The channel is a MessageEndpoint with the params flipped from the client's
// WorkerHandle (it posts WorkerToMain and receives MainToWorker), so the browser
// (`self`) and Node (`parentPort`) entries differ only in a ~10-line inline
// endpoint.

import { createOscTransport, type OscTransport } from "./transport";
import type { MainToWorker, WorkerToMain } from "./protocol";
import type { MessageEndpoint } from "./messageEndpoint";

const errText = (err: unknown) => (err instanceof Error ? err.message : String(err));

/** Wire a worker endpoint to a fresh WebSocket transport. Call once at worker entry. */
export function runTransportWorker(port: MessageEndpoint<WorkerToMain, MainToWorker>): void {
  let transport: OscTransport | null = null;
  const post = (msg: WorkerToMain, transfer?: Transferable[]) => port.postMessage(msg, transfer);

  port.onMessage((msg) => {
    switch (msg.type) {
      case "connect": {
        transport = createOscTransport(msg.url);
        // Transfer the frame's buffer so the main thread owns it zero-copy.
        transport.onMessage((bytes) => post({ type: "message", bytes }, [bytes.buffer]));
        transport.onError(() => post({ type: "error", message: "websocket error" }));
        transport.onClose(() => post({ type: "closed" }));
        transport.ready.then(
          () => post({ type: "open" }),
          (err) => post({ type: "error", message: errText(err) }),
        );
        return;
      }
      case "send": {
        if (!transport) {
          post({ type: "error", message: "send before connect" });
          return;
        }
        transport.send(msg.bytes);
        return;
      }
      case "disconnect": {
        void transport?.close();
        transport = null;
        return;
      }
    }
  });
}
