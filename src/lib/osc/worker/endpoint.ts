// The protocol composition root, shared by the real worker entry
// (worker.ts) and the synchronous test loopback (test-setup.ts): wire an
// OscClient's events onto a ProtocolPort and route every inbound protocol
// message into the client. The protocol is DERIVED from the client's own
// method surface (types/osc.d.ts), so the routing here is one generic
// apply — the Records below are the exhaustiveness gate (a new
// OscRequestMethod/OscCommandMethod fails to compile until listed).

import type { ProtocolPort } from "@/lib/osc/protocol/port";
import type { OscCommand, OscCommandMethod, OscRequest, OscRequestMethod } from "@/types/osc";
import { OscClient } from "./OscClient";
import type { WorkerTransport } from "./transport";

const REQUEST_METHODS: Record<OscRequestMethod, true> = {
  connect: true,
  createGroup: true,
  createSynth: true,
  sendSynthDef: true,
};
const COMMAND_METHODS: Record<OscCommandMethod, true> = {
  setControl: true,
  setControln: true,
  setNodeRun: true,
  freeSynth: true,
  freeGroup: true,
  freeSynthDef: true,
  subscribeScope: true,
  unsubscribeScope: true,
  sendDirt: true,
  close: true,
};

/** Build the worker-side endpoint: an OscClient whose telemetry events post
 *  back over `port`, with every inbound protocol message applied to it.
 *  Returns the client — the production entry discards it, the test setup
 *  keeps it as the spy/`handleReply` seam. `transport` defaults to the real
 *  WebSocket; tests inject stubs. */
export function createOscEndpoint(port: ProtocolPort, transport?: WorkerTransport): OscClient {
  // Each event forwards its args tuple; the scope chunk additionally moves
  // its sample buffer (a fresh allocation per chunk — nothing else reads it).
  const client = new OscClient(
    {
      open: (...args) => port.postMessage({ type: "open", args }),
      closed: (...args) => port.postMessage({ type: "closed", args }),
      log: (...args) => port.postMessage({ type: "log", args }),
      banner: (...args) => port.postMessage({ type: "banner", args }),
      status: (...args) => port.postMessage({ type: "status", args }),
      scopeChunk: (subId, chunk) =>
        port.postMessage({ type: "scopeChunk", args: [subId, chunk] }, [chunk.samples.buffer]),
    },
    transport,
  );
  port.onMessage((raw) => {
    const msg = raw as OscRequest | OscCommand;
    if (msg.type in REQUEST_METHODS) {
      // Awaited request: apply, settle back as a correlated reply event —
      // resolution value or stringified error.
      const { type, id, args } = msg as OscRequest;
      void Promise.resolve()
        .then(() => (client[type] as (...a: unknown[]) => unknown)(...args))
        .then(
          (result) => port.postMessage({ type: "reply", id, ok: true, result }),
          (error: unknown) =>
            port.postMessage({
              type: "reply",
              id,
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            }),
        );
    } else if (msg.type in COMMAND_METHODS) {
      (client[msg.type] as (...a: unknown[]) => unknown)(...msg.args);
    }
  });
  return client;
}
