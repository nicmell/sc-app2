/// <reference lib="webworker" />
// OSC worker endpoint — a thin port dispatcher over the SessionHub
// (sessions.ts owns all shared-session logic; docs/multi-tab.md the design).
// The SAME script serves both modes: as a SharedWorker (`onconnect`, one
// attached hub client per port — the production path) and as a dedicated
// worker (the no-SharedWorker fallback: the page's own message seam is the
// single implicit port). Plain packets cross postMessage; binary
// encode/decode lives hub-side beside the WebSocket transport — the codec
// subpath is the worker's only route to osc-js.

import type { TransportCommand } from "@/types/osc";
import { SessionHub, type PostEvent } from "./sessions";

const hub = new SessionHub();

function wire(post: PostEvent, target: { onmessage: ((ev: MessageEvent) => void) | null }): void {
  const client = hub.attach(post);
  target.onmessage = (ev: MessageEvent) => hub.handle(client, ev.data as TransportCommand);
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
