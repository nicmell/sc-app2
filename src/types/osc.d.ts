// OSC transport types: the client-facing session block and the postMessage
// protocol between the main-thread OscClientProxy and the worker-resident
// OscClient — requests (awaited, correlation-id'd) and commands
// (fire-and-forget) down, events up. All OSC encode/decode happens INSIDE the
// worker; only typed protocol messages cross the thread boundary (built by
// lib/osc/protocol/messages.ts — call sites never hand-write these shapes).

import type { DecodedScopeChunk } from "@sc-app/server-commands";
import type { ScsynthStatus } from "@/types/stores";

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

/** One tx/rx console entry as the worker emits it — the proxy assigns the
 *  stable React `id` when it appends to the store. */
export interface OscLogEntryPayload {
  ts: number;
  dir: "tx" | "rx";
  address: string;
  args: string[];
}

/** Awaited proxy → worker calls; the builder mints `id`, the worker answers
 *  with a matching `reply` event (the RPC half of the command methods). */
export type OscRequest =
  | { id: number; type: "connect"; url: string; session: OscSession }
  | { id: number; type: "createGroup"; targetId: number }
  | {
      id: number;
      type: "createSynth";
      defName: string;
      targetId: number;
      controls: Record<string, number>;
      arrayControls: Array<{ index: number; values: number[] }>;
    }
  | { id: number; type: "sendSynthDef"; bytes: Uint8Array };

/** Fire-and-forget proxy → worker calls (teardown, control writes, scope
 *  stream management — nothing scsynth acknowledges). */
export type OscCommand =
  | { type: "setControl"; nodeId: number; name: string; value: number }
  | { type: "setControln"; nodeId: number; name: string; values: number[] }
  | { type: "setNodeRun"; nodeId: number; flag: 0 | 1 }
  | { type: "freeSynth"; nodeId: number }
  | { type: "freeGroup"; groupId: number }
  | { type: "freeSynthDef"; name: string }
  | { type: "subscribeScope"; subId: number; scope: number; channels: number; chunkSize: number }
  | { type: "unsubscribeScope"; subId: number }
  | { type: "sendDirt"; event: Record<string, string | number>; timetag: number }
  | { type: "close" };

/** Worker → proxy: RPC replies, connection lifecycle, telemetry for the osc
 *  store slice, and the per-subId scope-chunk stream (samples transferred
 *  zero-copy). A real socket close carries the WebSocket code/reason; an
 *  orderly shutdown carries neither. */
export type OscEvent =
  | { type: "reply"; id: number; ok: true; result?: unknown }
  | { type: "reply"; id: number; ok: false; error: string }
  | { type: "open" }
  | { type: "closed"; code?: number; reason?: string }
  | { type: "log"; entries: OscLogEntryPayload[] }
  | { type: "banner"; address: string; message: string; variant: "error" | "warn" }
  | { type: "status"; scsynth: ScsynthStatus }
  | { type: "scopeChunk"; subId: number; chunk: DecodedScopeChunk };

/** What the in-worker WebSocket transport reports to the worker OscClient. */
export type TransportEvent =
  | { type: "open" }
  | { type: "message"; data: ArrayBuffer }
  | { type: "error"; message: string }
  | { type: "close"; code?: number; reason?: string };
