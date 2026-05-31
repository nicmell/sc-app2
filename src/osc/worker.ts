/// <reference lib="webworker" />
// OSC worker entry point. Owns the bridge WebSocket and all OSC decode: the
// main thread posts encoded bytes to send, and we post decoded inbound replies
// back. workerBootstrap MUST be imported first — it shims `window` for osc-js
// before @sc-app/server-commands (which pulls in osc-js) is evaluated.

import { setWorkerMessageHandler } from "./workerBootstrap";
import { decode, isMessage, parseScopeChunkArgs, SCOPE_CHUNK_ADDRESS } from "@sc-app/server-commands";
import { flattenPacket } from "./flatten";
import { createOscTransport, type OscTransport } from "./transport";
import type { MainToWorker, WorkerToMain } from "./protocol";

let transport: OscTransport | null = null;

function post(msg: WorkerToMain, transfer?: Transferable[]): void {
  self.postMessage(msg, transfer ?? []);
}

/** Decode an inbound frame and dispatch it. `/scope/chunk` is parsed into a
 *  fresh Float32Array and posted (transferred) as `scopeChunk`; everything else
 *  is flattened and posted as `reply`s. */
function handleInbound(bytes: Uint8Array): void {
  try {
    const packet = decode(bytes);
    if (isMessage(packet) && packet.address === SCOPE_CHUNK_ADDRESS) {
      const chunk = parseScopeChunkArgs(packet.args as unknown[]);
      post({ type: "scopeChunk", chunk }, [chunk.data.buffer]);
      return;
    }
    for (const reply of flattenPacket(packet)) {
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
