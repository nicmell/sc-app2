/// <reference lib="webworker" />
import type { ProtocolPort } from "@/lib/osc/protocol/port";

// The endpoint's module graph instantiates the wasm OSC component via
// top-level await, and the proxy posts its first RPC (`connect`) right
// after spawning the worker — a message arriving during that window would
// fire with no handler and be silently lost, wedging the RPC forever. So:
// register the handler in this module's SYNCHRONOUS prefix (before any
// await), buffer, and replay once the endpoint installs its dispatcher.
const scope = self as unknown as DedicatedWorkerGlobalScope;
const buffered: unknown[] = [];
let deliver: (msg: unknown) => void = (msg) => buffered.push(msg);
scope.onmessage = (event) => deliver(event.data);

const port: ProtocolPort = {
  postMessage: (msg, transfer) => scope.postMessage(msg, { transfer }),
  onMessage: (cb) => {
    deliver = cb;
    for (const msg of buffered.splice(0)) cb(msg);
  },
};

// Dynamic import: a static one would evaluate the endpoint graph (and its
// top-level await) BEFORE this module's prefix could arm the buffer.
const { createOscEndpoint } = await import("./endpoint");
createOscEndpoint(port);
