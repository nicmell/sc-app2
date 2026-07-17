// OSC transport types: the client-facing session block and the postMessage
// protocol between the main-thread OscClientProxy and the worker-resident
// OscClient. The protocol is DERIVED, not hand-spelled: a request/command is
// `{type: <method>, args: Parameters<OscClient[method]>}` for the worker
// client's own method surface, and an event mirrors `OscClientEvents` the
// same way — so adding a message is exactly one worker method (or event) plus
// one proxy method, with nothing to keep in sync here. All OSC encode/decode
// happens INSIDE the worker; only these typed protocol messages cross the
// thread boundary.

import type { OscClient, OscClientEvents } from "@/lib/osc/worker/OscClient";

/** A session's scsynth allocation, as `connect` consumes it. */
export interface OscSession {
  /** The session's group — created by `connect` at the tail of scsynth's root group. */
  sessionGroupId: number;
  /** First node id this session may allocate. */
  nodeIdBase: number;
  /** How many node ids this session may allocate. */
  nodeIdCount: number;
  /** First scsynth scope-buffer index this session may use — the proxy
   *  allocates one slot per scope tap from the span (`allocScopeIndex`). */
  scopeIndexBase: number;
  /** How many scope-buffer slots this session owns. */
  scopeIndexCount: number;
}

/** The worker methods the proxy awaits (RPC — the proxy mints `id`, the
 *  worker answers with a matching `reply` event). */
export type OscRequestMethod = "connect" | "createGroup" | "createSynth" | "sendSynthDef";

/** The fire-and-forget worker methods (teardown, control writes, scope
 *  stream management — nothing scsynth acknowledges). */
export type OscCommandMethod =
  | "setControl"
  | "setControln"
  | "setNodeRun"
  | "freeSynth"
  | "freeGroup"
  | "freeSynthDef"
  | "subscribeScope"
  | "unsubscribeScope"
  | "sendDirt"
  | "close";

/** Awaited proxy → worker calls, derived from the worker method signatures. */
export type OscRequest = {
  [K in OscRequestMethod]: { type: K; id: number; args: Parameters<OscClient[K]> };
}[OscRequestMethod];

/** Fire-and-forget proxy → worker calls, derived the same way. */
export type OscCommand = {
  [K in OscCommandMethod]: { type: K; args: Parameters<OscClient[K]> };
}[OscCommandMethod];

/** Worker → proxy: RPC replies plus the telemetry stream, mirroring
 *  `OscClientEvents` (connection lifecycle, log batches, banners, scsynth
 *  status, and the per-subId scope chunks — samples transferred zero-copy). */
export type OscEvent =
  | { type: "reply"; id: number; ok: true; result?: unknown }
  | { type: "reply"; id: number; ok: false; error: string }
  | {
      [K in keyof OscClientEvents]: { type: K; args: Parameters<OscClientEvents[K]> };
    }[keyof OscClientEvents];

/** What the in-worker WebSocket transport reports to the worker OscClient. */
export type TransportEvent =
  | { type: "open" }
  | { type: "message"; data: ArrayBuffer }
  | { type: "error"; message: string }
  | { type: "close"; code?: number; reason?: string };
