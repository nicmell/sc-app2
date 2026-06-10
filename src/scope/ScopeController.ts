// A single fixed scope: taps scsynth's stereo master out (bus 0) into a SHM
// scope buffer and streams it back for the waveform display. No global clock —
// the bridge polls SHM on a timer (see src-tauri router/ws.rs).
//
// On start it: allocates a node id from the session block (client.nextNodeId),
// /d_recv's the tap SynthDef with the /s_new riding as the completion message
// (atomic, no /sync), subscribes to /scope/chunk, then sends /scope/subscribe
// so the bridge begins polling. The tap is created inside the session's group
// (at the tail of scsynth's root group, so it reads the post-SuperDirt master
// out). The latest chunk is written to `chunkRef`, which ScopeView's RAF loop
// reads — never React state (chunks arrive ~47 Hz).

import OSC from "osc-js";
import {
  AddToTail,
  dRecv,
  encode,
  nFree,
  parseScopeChunkArgs,
  SCOPE_CHUNK_ADDRESS,
  sNew,
  scopeSubscribe,
  scopeUnsubscribe,
  type DecodedScopeChunk,
} from "@sc-app/server-commands";
import type { OscClient } from "../osc/OscClient";
import { compileScopeTapSynthDef, scopeTapSynthDefName } from "./scopeTapSynthDef";

/** SuperDirt sums all orbits to the stereo master out (bus 0/1). */
const INPUT_BUS = 0;
const CHANNELS = 2;
/** Frames per scope slot = one chunk (~21 ms at 48 kHz). */
const CHUNK_SIZE = 1024;
/** Fixed subscription id (one subscription per WS connection). */
const SUB_ID = 1;

export class ScopeController {
  /** Latest decoded chunk; ScopeView reads this in its RAF loop. */
  readonly chunkRef: { current: DecodedScopeChunk | null } = { current: null };

  private readonly client: OscClient;
  private readonly groupId: number;
  /** Per-session SHM scope-buffer index (server-assigned) so concurrent
   *  windows tap into distinct buffers instead of stomping a shared one. */
  private readonly scopeIndex: number;
  private tapNodeId: number | null = null;
  private chunkSubId: number | null = null;
  private started = false;
  private disposed = false;

  constructor(client: OscClient, sessionGroupId: number, scopeIndex: number) {
    this.client = client;
    this.groupId = sessionGroupId;
    this.scopeIndex = scopeIndex;
  }

  start(): void {
    if (this.started || this.disposed) return;
    this.started = true;

    const name = scopeTapSynthDefName(CHANNELS, CHUNK_SIZE);
    const tapBytes = compileScopeTapSynthDef(CHANNELS, CHUNK_SIZE);
    // The session group is brand-new on every connect (sessions die with their
    // WebSocket), so there is never a stale tap to clear.
    const nodeId = this.client.nextNodeId();
    this.tapNodeId = nodeId;

    // /d_recv the tap def; its completion message /s_new's the tap at the tail
    // of this session's group so it reads the post-mix master out.
    const sNewMsg = sNew(name, nodeId, AddToTail, this.groupId, {
      inBus: INPUT_BUS,
      scopeNum: this.scopeIndex,
    });
    this.client.send(dRecv(tapBytes, encode(sNewMsg)));

    // Stream the slot the tap writes; the bridge intercepts this subscribe.
    // `/scope/chunk` is an ordinary OSC message — subscribe to its address.
    this.chunkSubId = this.client.on(SCOPE_CHUNK_ADDRESS, (msg: OSC.Message) => {
      let chunk: DecodedScopeChunk;
      try {
        chunk = parseScopeChunkArgs(msg.args as unknown[]);
      } catch (err) {
        console.error("[scope] bad /scope/chunk:", err);
        return;
      }
      if (chunk.subId !== SUB_ID) return;
      this.chunkRef.current = chunk;
    });
    this.client.send(
      scopeSubscribe({ subId: SUB_ID, scope: this.scopeIndex, channels: CHANNELS, chunkSize: CHUNK_SIZE }),
    );
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.chunkSubId !== null) this.client.off(SCOPE_CHUNK_ADDRESS, this.chunkSubId);
    this.chunkSubId = null;
    this.chunkRef.current = null;
    // Stop bridge polling, then free the tap synth.
    this.client.send(scopeUnsubscribe(SUB_ID));
    if (this.tapNodeId !== null) this.client.send(nFree(this.tapNodeId));
  }
}
