// A single fixed scope: taps scsynth's stereo master out (bus 0) into a SHM
// scope buffer and streams it back for the waveform display. No global clock —
// the bridge polls SHM on a timer (see src-tauri router/ws.rs).
//
// On start it: allocates a node id from the session block and clears any stale
// tap at that id (a previous mount), /d_recv's the tap SynthDef with the /s_new
// riding as the completion message (atomic, no /sync), subscribes to
// /scope/chunk, then sends /scope/subscribe so the bridge begins polling. The
// tap is created inside the session's group (under the bridge root group at the
// tail of scsynth's root, so it still reads the post-SuperDirt master out). The
// latest chunk is written to `chunkRef`, which ScopeView's RAF loop reads —
// never React state (chunks arrive ~47 Hz).

import {
  AddToHead,
  AddToTail,
  dRecv,
  encode,
  gFreeAll,
  nFree,
  sNew,
  scopeSubscribe,
  scopeUnsubscribe,
  type DecodedScopeChunk,
} from "@sc-app/server-commands";
import type { WorkerClient } from "../osc/WorkerClient";
import type { IdAllocator } from "../session/IdAllocator";
import { compileScopeTapSynthDef, scopeTapSynthDefName } from "../synthdefs/scopeTapSynthDef";
import { compileTestToneSynthDef, testToneSynthDefName } from "../synthdefs/testToneSynthDef";

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

  private readonly client: WorkerClient;
  private readonly groupId: number;
  private readonly ids: IdAllocator;
  /** Per-session SHM scope-buffer index (server-assigned) so concurrent
   *  windows tap into distinct buffers instead of stomping a shared one. */
  private readonly scopeIndex: number;
  private tapNodeId: number | null = null;
  private offChunk: (() => void) | null = null;
  private started = false;
  private disposed = false;
  /** Diagnostics: total chunks received + whether to log stats to the console
   *  (debug-console drawer). Enable with `localStorage.setItem('sc.scopeDebug','1')`. */
  private chunkCount = 0;
  private readonly debug =
    typeof localStorage !== "undefined" && !!localStorage.getItem("sc.scopeDebug");
  /** Diagnostics: inject a 220 Hz sine onto the tapped bus so a working scope
   *  shows it (and it's audible) — isolates the pipeline from SuperDirt.
   *  Enable with `localStorage.setItem('sc.scopeTestTone','1')`. */
  private readonly testTone =
    typeof localStorage !== "undefined" && !!localStorage.getItem("sc.scopeTestTone");

  constructor(client: WorkerClient, sessionGroupId: number, ids: IdAllocator, scopeIndex: number) {
    this.client = client;
    this.groupId = sessionGroupId;
    this.ids = ids;
    this.scopeIndex = scopeIndex;
  }

  start(): void {
    if (this.started || this.disposed) return;
    this.started = true;

    const name = scopeTapSynthDefName(CHANNELS, CHUNK_SIZE);
    const tapBytes = compileScopeTapSynthDef(CHANNELS, CHUNK_SIZE);
    // Clear any stale tap from a prior connect before re-creating ours. We free
    // the whole session group (which only holds our tap) rather than `/n_free`
    // a specific node: `/g_freeAll` is a no-op on an empty group, so a fresh
    // session doesn't trigger a "Node not found" /fail, while a reload still
    // clears the tap left behind within the reconnect grace window.
    const nodeId = this.ids.alloc();
    this.tapNodeId = nodeId;
    this.client.sendCommand(gFreeAll(this.groupId));

    // /d_recv the tap def; its completion message /s_new's the tap at the tail
    // of this session's group so it reads the post-mix master out.
    const sNewMsg = sNew(name, nodeId, AddToTail, this.groupId, {
      inBus: INPUT_BUS,
      scopeNum: this.scopeIndex,
    });
    this.client.sendCommand(dRecv(tapBytes, encode(sNewMsg)));

    // Diagnostic: a known sine onto the tapped bus, at the HEAD of the session
    // group so it runs before the tap reads the bus. If the scope shows this
    // (and it's audible), the whole tap→SHM→bridge→canvas path is healthy.
    if (this.testTone) {
      const toneMsg = sNew(testToneSynthDefName(), this.ids.alloc(), AddToHead, this.groupId, {
        out: INPUT_BUS,
        freq: 220,
        amp: 0.2,
      });
      this.client.sendCommand(dRecv(compileTestToneSynthDef(), encode(toneMsg)));
      console.log(`[scope] TEST TONE: 220Hz → bus ${INPUT_BUS} (expect an audible sine + waveform)`);
    }

    // Stream the slot the tap writes; the bridge intercepts this subscribe.
    this.offChunk = this.client.onScopeChunk((chunk) => {
      if (chunk.subId !== SUB_ID) return;
      this.chunkRef.current = chunk;
      if (this.debug) this.logChunk(chunk);
    });
    this.client.sendCommand(
      scopeSubscribe({ subId: SUB_ID, scope: this.scopeIndex, channels: CHANNELS, chunkSize: CHUNK_SIZE }),
    );
    if (this.debug) {
      console.log(`[scope] subscribed: group=${this.groupId} tap=${nodeId} scopeIndex=${this.scopeIndex}`);
    }
  }

  /** Log chunk stats (~1×/sec) to the console so the debug-console drawer shows
   *  whether non-zero audio is reaching the browser. */
  private logChunk(chunk: DecodedScopeChunk): void {
    this.chunkCount++;
    if (this.chunkCount % 50 !== 1) return;
    let min = Infinity;
    let max = -Infinity;
    const d = chunk.data;
    for (let i = 0; i < d.length; i++) {
      if (d[i] < min) min = d[i];
      if (d[i] > max) max = d[i];
    }
    console.log(
      `[scope] chunks=${this.chunkCount} ch=${chunk.channels} frames=${chunk.frameCount} ` +
        `min=${min.toFixed(4)} max=${max.toFixed(4)}`,
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
    if (this.tapNodeId !== null) this.client.sendCommand(nFree(this.tapNodeId));
  }
}
