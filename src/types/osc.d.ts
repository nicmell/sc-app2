// OSC transport types: the client-facing session block and the message
// protocol between the WorkerClient (main thread) and the WebSocket-owning
// worker — commands down, transport events up. OSC traffic crosses this
// boundary as plain packets; the worker owns binary encode/decode.
//
// The worker is SHARED across same-origin clients (the dashboard, its box
// iframes, popped-out tabs — see docs/multi-tab.md): clients JOIN a session
// (the first joiner opens the ONE WebSocket; later joiners attach to the
// standing connection) and LEAVE it (the socket closes when the last client
// is gone, after a grace window). Side-band requests — allocation, box
// claims, presets — ride the correlated `rpc` frames; raw OSC stays
// uncorrelated exactly as before.

import type { OscPacket } from "@sc-app/server-commands";
import type { BoxPresets } from "@/types/api";

/** A session's scsynth allocation, as `OscClient.connect` consumes it. */
export interface OscSession {
  /** The session's group — created by the WORKER at the tail of scsynth's
   *  root group when the shared socket opens. */
  sessionGroupId: number;
  /** First node id this session may allocate. */
  nodeIdBase: number;
  /** How many node ids this session may allocate. */
  nodeIdCount: number;
  /** First scsynth scope-buffer index this session may use — slots are
   *  allocated worker-side (`alloc-scope`), one per scope tap. */
  scopeIndexBase: number;
  /** How many scope-buffer slots this session owns. */
  scopeIndexCount: number;
}

/** A side-band request to the worker (correlated by the `rpc` frame id). */
export type RpcRequest =
  | { op: "alloc-nodes" }
  | { op: "alloc-scope" }
  | { op: "free-scope"; index: number }
  | { op: "box-claim"; boxId: string }
  | { op: "box-release"; boxId: string }
  | { op: "presets-put"; boxId: string; entry: BoxPresets }
  | { op: "presets-get"; boxId: string };

export type RpcResult = { ok: true; value?: unknown } | { ok: false; error: string };

/** What the transport is told to do (WorkerClient → worker). */
export type TransportCommand =
  | { type: "join"; url: string; sessionId: string; session: OscSession; lockName?: string }
  | { type: "osc"; packet: OscPacket }
  | { type: "rpc"; id: number; req: RpcRequest }
  | { type: "leave" };

/** What the transport reports (worker → WorkerClient). `joined` answers a
 *  `join` (always before the connection's own events); `open`/`close` are
 *  the shared socket's lifecycle, fanned out to every member; `presets` is a
 *  sibling client's forwarded harvest. A real socket close carries the
 *  WebSocket close code/reason for diagnostics; a WorkerClient-synthesized
 *  close may carry the worker-crash reason. */
export type TransportEvent =
  | { type: "joined"; clientId: number; connected: boolean; nodes: { start: number; end: number } }
  | { type: "open" }
  | { type: "respawn" }
  | { type: "osc"; packet: OscPacket }
  | { type: "rpc-reply"; id: number; result: RpcResult }
  | { type: "presets"; boxId: string; entry: BoxPresets }
  | { type: "error"; message: string }
  | { type: "close"; code?: number; reason?: string };
