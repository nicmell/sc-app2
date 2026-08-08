/// <reference lib="webworker" />
// OSC Web Worker endpoint: plain packets cross postMessage; binary frames are
// encoded/decoded here beside the WebSocket transport. The codec subpath is
// the worker's only route to osc-js.

import { decode, encode } from "@sc-app/server-commands/codec";
import type { OscPacket } from "@sc-app/server-commands";
import type { TransportCommand, TransportEvent } from "@/types/osc";
import { createWsTransport } from "./transport";

const transport = createWsTransport();
const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (event: TransportEvent, transfer?: Transferable[]) =>
  scope.postMessage(event, { transfer });

function collectBlobBuffers(packet: OscPacket, out: ArrayBuffer[]): void {
  if ("timetag" in packet) {
    for (const child of packet.packets) collectBlobBuffers(child, out);
    return;
  }
  for (const arg of packet.args) {
    if (arg instanceof Uint8Array) out.push(arg.buffer);
  }
}

transport.onEvent((event) => {
  if (event.type !== "message") {
    post(event);
    return;
  }
  try {
    const packet = decode(new Uint8Array(event.data));
    const transfer: ArrayBuffer[] = [];
    collectBlobBuffers(packet, transfer);
    post({ type: "osc", packet }, transfer);
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
});

scope.onmessage = (ev: MessageEvent<TransportCommand>) => {
  const command = ev.data;
  switch (command.type) {
    case "open":
      transport.open(command.url);
      return;
    case "close":
      transport.close();
      return;
    case "osc":
      try {
        transport.send(encode(command.packet));
      } catch (error) {
        post({ type: "error", message: error instanceof Error ? error.message : String(error) });
      }
  }
};
