// A single fixed scope: taps scsynth's stereo master out (bus 0) into a SHM
// scope buffer and streams it back for the waveform display. No global clock —
// the bridge polls SHM on a timer (see src-tauri router/ws.rs).
//
// A global singleton (`scopeController`) living independently on the
// OscClient: it arms itself on the client's `connected` signal (which the
// client raises only after the session group exists and the node-id allocator
// is armed) and stops when it drops — no session-manager ownership.
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
import {
  SCOPE_CHANNELS,
  SCOPE_CHUNK_SIZE,
  SCOPE_INPUT_BUS,
  SCOPE_SUB_ID,
} from "@/constants/osc";
import { oscClient, type OscClient } from "@/lib/osc/OscClient";
import { compileScopeTapSynthDef, scopeTapSynthDefName } from "./scopeTapSynthDef";

export class ScopeController {
  /** Latest decoded chunk; ScopeView reads this in its RAF loop. */
  readonly chunkRef: { current: DecodedScopeChunk | null } = { current: null };

  private readonly client: OscClient;
  private tapNodeId: number | null = null;
  private chunkSubId: number | null = null;
  private started = false;

  constructor(client: OscClient) {
    this.client = client;
    // Live with the connection: the client raises `connected` once the
    // session group exists and the allocator is armed, and drops it (before
    // the socket closes) on every termination — including the ones the
    // client triggers itself (transport error, heartbeat timeout).
    client.connected.subscribe((connected) => (connected ? this.start() : this.stop()));
  }

  private start(): void {
    if (this.started) return;
    this.started = true;
    // The session block arrived with the connection that just armed us.
    const groupId = this.client.sessionGroupId;
    const scopeIndex = this.client.scopeIndex;

    const name = scopeTapSynthDefName(SCOPE_CHANNELS, SCOPE_CHUNK_SIZE);
    const tapBytes = compileScopeTapSynthDef(SCOPE_CHANNELS, SCOPE_CHUNK_SIZE);
    // The session group is brand-new on every connect (sessions die with their
    // WebSocket), so there is never a stale tap to clear.
    const nodeId = this.client.nextNodeId();
    this.tapNodeId = nodeId;

    // /d_recv the tap def; its completion message /s_new's the tap at the tail
    // of this session's group so it reads the post-mix master out.
    const sNewMsg = sNew(name, nodeId, AddToTail, groupId, {
      inBus: SCOPE_INPUT_BUS,
      scopeNum: scopeIndex,
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
      if (chunk.subId !== SCOPE_SUB_ID) return;
      this.chunkRef.current = chunk;
    });
    this.client.send(
      scopeSubscribe({ subId: SCOPE_SUB_ID, scope: scopeIndex, channels: SCOPE_CHANNELS, chunkSize: SCOPE_CHUNK_SIZE }),
    );
  }

  /** Tear the tap down and reset, so the next connection re-arms. The sends
   *  go out while the socket is still open on an orderly close, and are
   *  harmlessly dropped on a dead transport (the bridge frees the session
   *  group with the WebSocket anyway). */
  private stop(): void {
    if (!this.started) return;
    this.started = false;
    if (this.chunkSubId !== null) this.client.off(SCOPE_CHUNK_ADDRESS, this.chunkSubId);
    this.chunkSubId = null;
    this.chunkRef.current = null;
    // Stop bridge polling, then free the tap synth.
    this.client.send(scopeUnsubscribe(SCOPE_SUB_ID));
    if (this.tapNodeId !== null) this.client.send(nFree(this.tapNodeId));
    this.tapNodeId = null;
  }
}

/** The one master-out scope for the whole frontend, riding the global
 *  `oscClient` — globally accessible (ScopeView reads `chunkRef`) and fully
 *  self-managing over the connection lifecycle. */
export const scopeController = new ScopeController(oscClient);
