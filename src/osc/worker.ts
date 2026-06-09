/// <reference lib="webworker" />
// OSC worker entry point (browser). Bridges `self` postMessages ↔ the shared
// bridge core in `./bridge` (which owns the WebSocket + OSC decode).
// `workerBootstrap` MUST be imported first — it shims `window` for osc-js before
// @sc-app/server-commands (which createOscBridge pulls in) is evaluated.

import { setWorkerMessageHandler } from "./workerBootstrap";
import { createOscBridge, type OscBridge } from "./bridge";
import type { MainToWorker, WorkerToMain } from "../types/protocol";

let bridge: OscBridge | null = null;

function post(msg: WorkerToMain, transfer?: Transferable[]): void {
  self.postMessage(msg, transfer ?? []);
}

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

setWorkerMessageHandler((msg) => {
  void handle(msg);
});
