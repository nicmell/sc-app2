// A single fixed scope: taps scsynth's stereo master out (bus 0) into a SHM
// scope buffer and streams it back for the waveform display. No allocator, no
// global clock — the bridge polls SHM on a timer (see src-tauri router/ws.rs).
//
// On start it: clears any stale tap (a previous mount), /d_recv's the tap
// SynthDef with the /s_new riding as the completion message (atomic, no /sync),
// subscribes to /scope/chunk, then sends /scope/subscribe so the bridge begins
// polling. The latest chunk is written to `chunkRef`, which ScopeView's RAF
// loop reads — never React state (chunks arrive ~47 Hz).

import {
  AddToTail,
  dRecv,
  encode,
  nFree,
  sNew,
  scopeSubscribe,
  scopeUnsubscribe,
  type DecodedScopeChunk,
} from "@sc-app/server-commands";
import type { WorkerClient } from "../osc/WorkerClient";
import { compileScopeTapSynthDef, scopeTapSynthDefName } from "../synthdefs/scopeTapSynthDef";

/** SuperDirt sums all orbits to the stereo master out (bus 0/1). */
const INPUT_BUS = 0;
const CHANNELS = 2;
/** Frames per scope slot = one chunk (~21 ms at 48 kHz). */
const CHUNK_SIZE = 1024;
/** Fixed SHM scope-buffer index (we own the only scope). */
const SCOPE_INDEX = 0;
/** Fixed subscription id (single subscription). */
const SUB_ID = 1;
/** High, collision-safe node id for the tap synth (clear of SuperDirt's nodes). */
const TAP_NODE_ID = 9_990_000;

export class ScopeController {
  /** Latest decoded chunk; ScopeView reads this in its RAF loop. */
  readonly chunkRef: { current: DecodedScopeChunk | null } = { current: null };

  private readonly client: WorkerClient;
  private offChunk: (() => void) | null = null;
  private started = false;
  private disposed = false;

  constructor(client: WorkerClient) {
    this.client = client;
  }

  start(): void {
    if (this.started || this.disposed) return;
    this.started = true;

    const name = scopeTapSynthDefName(CHANNELS, CHUNK_SIZE);
    const tapBytes = compileScopeTapSynthDef(CHANNELS, CHUNK_SIZE);

    // Drop a stale tap from a previous mount so the /s_new below can't collide.
    this.client.sendCommand(nFree(TAP_NODE_ID));

    // /d_recv the tap def; its completion message /s_new's the tap at the tail
    // of the root group (after SuperDirt) so it reads the post-mix master out.
    const sNewMsg = sNew(name, TAP_NODE_ID, AddToTail, 0, {
      inBus: INPUT_BUS,
      scopeNum: SCOPE_INDEX,
    });
    this.client.sendCommand(dRecv(tapBytes, encode(sNewMsg)));

    // Stream the slot the tap writes; the bridge intercepts this subscribe.
    this.offChunk = this.client.onScopeChunk((chunk) => {
      if (chunk.subId === SUB_ID) this.chunkRef.current = chunk;
    });
    this.client.sendCommand(
      scopeSubscribe({ subId: SUB_ID, scope: SCOPE_INDEX, channels: CHANNELS, chunkSize: CHUNK_SIZE }),
    );
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.offChunk?.();
    this.offChunk = null;
    this.chunkRef.current = null;
    // Stop bridge polling, then free the tap synth.
    this.client.sendCommand(scopeUnsubscribe(SUB_ID));
    this.client.sendCommand(nFree(TAP_NODE_ID));
  }
}
