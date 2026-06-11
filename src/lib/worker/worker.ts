/// <reference lib="webworker" />
// The Web Worker entry, keeping socket traffic off the main thread. A dumb
// relay: it wires the postMessage protocol (types/osc.d.ts) to the raw
// WebSocket transport (transport.ts) — commands in, events out. No osc-js
// here — encode/decode live in the OscClient's plugin notify path.

import { createWsTransport } from "./transport";
import type { TransportCommand, TransportEvent } from "@/types/osc";

const transport = createWsTransport();

const post = (msg: TransportEvent, transfer?: Transferable[]) =>
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg, { transfer });

// Transfer inbound frames' buffers so the main thread owns them zero-copy.
transport.onEvent((msg) => post(msg, msg.type === "message" ? [msg.data] : undefined));

self.onmessage = (ev: MessageEvent<TransportCommand>) => {
  const msg = ev.data;
  switch (msg.type) {
    case "open":
      transport.open(msg.url);
      return;
    case "send":
      transport.send(msg.data);
      return;
    case "close":
      transport.close();
      return;
  }
};
