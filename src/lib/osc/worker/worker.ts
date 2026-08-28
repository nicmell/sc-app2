/// <reference lib="webworker" />
// OSC worker entry — a thin port dispatcher over the shared OscEndpoint
// (endpoint.ts owns the socket, codec, clock, and all per-port bookkeeping).
// The SAME script serves both modes: as a SharedWorker (`onconnect`, one
// endpoint port per MessagePort — the production path, shared by every
// same-origin client), and as a dedicated worker (the no-SharedWorker
// fallback: the page's own message seam is the single implicit port). Plain
// packets cross postMessage; binary encode/decode lives endpoint-side — the
// codec subpath is the worker's only route to osc-js.

import type { TransportCommand } from "@/types/osc";
import { OscEndpoint, type PostEvent } from "./endpoint";

const endpoint = new OscEndpoint();

function wire(post: PostEvent, target: { onmessage: ((ev: MessageEvent) => void) | null }): void {
  const port = endpoint.attach(post);
  target.onmessage = (ev: MessageEvent) => endpoint.handle(port, ev.data as TransportCommand);
}

if ("onconnect" in self) {
  (self as unknown as SharedWorkerGlobalScope).onconnect = (ev: MessageEvent) => {
    const port = ev.ports[0];
    wire((event, transfer) => port.postMessage(event, { transfer: transfer ?? [] }), port);
    port.start();
  };
} else {
  const scope = self as unknown as DedicatedWorkerGlobalScope;
  wire((event, transfer) => scope.postMessage(event, { transfer: transfer ?? [] }), scope);
}
