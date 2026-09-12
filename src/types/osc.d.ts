// OSC transport types: the client-facing session block and the message
// protocol between the WorkerClient (main thread) and the WebSocket-owning
// worker — commands down, transport events up. OSC traffic crosses this
// boundary as plain MESSAGES only — bundles never do: outbound scheduling
// rides the `at` metadata (a bridge-time Unix-ms timetag; the worker
// endpoint wraps the message in the OSC bundle at encode time), and
// inbound bundles are flattened to messages in wire order before posting
// up. The worker owns binary encode/decode.

import type { OscMessage } from "@sc-app/server-commands";

/** A session's scsynth allocation, as `OscClient.connect` consumes it. */
export interface OscSession {
  /** The session's group — created by `connect` at the tail of scsynth's root group. */
  sessionGroupId: number;
  /** First node id this session may allocate. */
  nodeIdBase: number;
  /** How many node ids this session may allocate. */
  nodeIdCount: number;
  /** First scsynth scope-buffer index this session may use — the client
   *  allocates one slot per scope tap from the span (`allocScopeIndex`). */
  scopeIndexBase: number;
  /** How many scope-buffer slots this session owns. */
  scopeIndexCount: number;
}

/** What the transport is told to do (WorkerClient → worker). `at` schedules
 *  the message: a bridge-time Unix-ms timetag the endpoint wraps into an
 *  OSC bundle at encode time. */
export type TransportCommand =
  | { type: "open"; url: string }
  | { type: "osc"; packet: OscMessage; at?: number }
  | { type: "close" };

/** What the transport reports (transport → worker → WorkerClient). A real
 *  socket close carries the WebSocket close code/reason for diagnostics; a
 *  WorkerClient-synthesized close may carry the worker-crash reason. */
export type TransportEvent =
  | { type: "open" }
  | { type: "respawn" }
  | { type: "osc"; packet: OscMessage }
  | { type: "error"; message: string }
  | { type: "close"; code?: number; reason?: string };
