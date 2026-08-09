/// <reference lib="webworker" />
// OSC Web Worker endpoint: plain packets cross postMessage; binary frames are
// encoded/decoded here beside the WebSocket transport. The codec subpath is
// the worker's only route to osc-js.

import { decode, encode } from "@sc-app/server-commands/codec";
import { CLOCK_PONG_ADDRESS, isMessage, type OscPacket } from "@sc-app/server-commands";
import type { TransportCommand, TransportEvent } from "@/types/osc";
import { createWsTransport } from "./transport";
import { WorkerClock } from "./clock";

const transport = createWsTransport();
const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (event: TransportEvent, transfer?: Transferable[]) =>
  scope.postMessage(event, { transfer });
const clock = new WorkerClock({
  post: (packet) => post({ type: "osc", packet }),
  sendPing: (packet) => transport.send(encode(packet)),
});

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
    if (event.type === "open") clock.onOpen();
    if (event.type === "close") clock.onClose();
    post(event);
    return;
  }
  try {
    const packet = decode(new Uint8Array(event.data));
    if (isMessage(packet) && packet.address === CLOCK_PONG_ADDRESS) {
      clock.onPong(packet, performance.now(), Date.now());
      return;
    }
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
      clock.onClose();
      transport.close();
      return;
    case "osc":
      try {
        // Only our code creates clock commands, always as bare messages;
        // bundles deliberately remain ordinary transport traffic.
        if (isMessage(command.packet) && command.packet.address.startsWith("/clock/")) {
          clock.handleCommand(command.packet);
          return;
        }
        transport.send(encode(command.packet));
      } catch (error) {
        post({ type: "error", message: error instanceof Error ? error.message : String(error) });
      }
  }
};
