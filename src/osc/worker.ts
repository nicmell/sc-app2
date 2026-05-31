/// <reference lib="webworker" />
// OSC worker entry point. Owns the bridge WebSocket and all OSC decode: the
// main thread posts encoded bytes to send, and we post decoded inbound replies
// back. workerBootstrap MUST be imported first — it shims `window` for osc-js
// before @sc-app/server-commands (which pulls in osc-js) is evaluated.

import { setWorkerMessageHandler } from "./workerBootstrap";
import { decode } from "@sc-app/server-commands";
import { flattenPacket } from "./flatten";
import { createOscTransport, type OscTransport } from "./transport";
import type { MainToWorker, WorkerToMain } from "./protocol";

let transport: OscTransport | null = null;

function post(msg: WorkerToMain): void {
  self.postMessage(msg);
}

/** Decode an inbound frame and post each message as a `reply` (bundles flattened). */
function handleInbound(bytes: Uint8Array): void {
  try {
    for (const reply of flattenPacket(decode(bytes))) {
      post({ type: "reply", reply });
    }
  } catch (err) {
    console.error("[sc:worker] decode failed", err, bytes);
    post({
      type: "error",
      message: `decode failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

async function handle(msg: MainToWorker): Promise<void> {
  switch (msg.type) {
    case "connect": {
      const t = createOscTransport(msg.url);
      transport = t;
      t.onMessage(handleInbound);
      t.onError(() => post({ type: "error", message: "websocket error" }));
      t.onClose(() => post({ type: "closed" }));
      try {
        await t.ready;
        post({ type: "ready" });
      } catch (err) {
        post({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
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
      if (transport) {
        await transport.close();
        transport = null;
      }
      return;
    }
  }
}

setWorkerMessageHandler((msg) => {
  void handle(msg);
});
