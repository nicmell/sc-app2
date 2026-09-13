// The Conductor (CONDUCTOR.md — read it first): the session's MUSICAL
// time. One module owns transport state (stopped/playing/paused), the
// session tempo (cps internally; the header displays BPM), and the
// position in CYCLES — advanced by reading the audio timebase
// (`oscClient.clock.audioTime()`, the same getTime Strudel runs on)
// with Cyclist's own math: position = base + (audioTime − anchor)·cps,
// re-anchored on every state or tempo change. A parallel seconds
// accumulator keeps the M:SS display honest across tempo changes.
//
// Audio: play/pause = /n_run on the SESSION GROUP (scsynth unhooks the
// calc func — every voice freezes bit-exact and resumes in place); the
// group BOOTS paused (OscClient.connect), so plugins load silent and
// the first play starts everything on one block. Stop = unload() on
// every mounted <sc-plugin> (gFreeAll kills the voices; the tree walk
// also stops Strudel mirrors) — play from stopped reloads them into
// the still-paused group. Known cost, accepted: each stop→play replays
// /d_recv + /synced per synthdef and burns node ids.
//
// Strudel: the pause is `scheduler.setCps(0)` — the ONLY exact one
// (Cyclist re-anchors on a cps change and Δt·0 freezes lastEnd;
// Cyclist.pause() resumes fast-forwarded, stop() rewinds). The widgets
// own the per-mirror seam (conductorFreeze/Resume/SetCps + the
// defaultOutput gate against the frozen-on-onset NaN hazard); tempo is
// SESSION-level and two-way: header → conductor → every mirror, and a
// pattern's own setcps() reaches us through the wrapped
// repl.scheduler.setCps (see sc-strudel), last writer wins.
//
// Module singleton, parallel to `session`/`oscClient` — reachable from
// React and Lit alike. Side-effect imported by main.tsx.

import { ELEMENTS } from "@/constants/sc-elements";
import { SliceName } from "@/constants/store";
import { oscClient } from "@/lib/osc/OscClient";
import { appStore } from "@/stores/store";
import type { ScPlugin } from "@/sc-elements/nodes/sc-plugin/sc-plugin";
import type { ScStrudel } from "@/sc-elements/widgets/sc-strudel/sc-strudel";
import type { ConductorState } from "@/types/stores";

/** The BPM display convention: 1 cycle = 1 bar in 4/4 (Strudel's own
 *  `setcpm(bpm/4)` idiom) — bpm = cps · 60 · BEATS_PER_CYCLE. Display
 *  only; the internal unit is ALWAYS cps. */
export const BEATS_PER_CYCLE = 4;

export const cpsToBpm = (cps: number): number => cps * 60 * BEATS_PER_CYCLE;
export const bpmToCps = (bpm: number): number => bpm / (60 * BEATS_PER_CYCLE);

const IDLE: Omit<ConductorState, "cps"> = {
  state: "stopped",
  cycleBase: 0,
  secondsBase: 0,
  anchorAudioTime: null,
};

export class Conductor {
  private readonly slice = appStore.slice(SliceName.CONDUCTOR);

  constructor() {
    oscClient.connected.subscribe((up) => {
      if (!up) this.slice.update((s) => ({ ...s, ...IDLE }));
    });
  }

  get state(): ConductorState {
    return this.slice.get();
  }

  /** The session tempo in cps (the internal unit — BPM is display). */
  get cps(): number {
    return this.state.cps;
  }

  /** Current position in cycles (frozen while not playing). */
  cycle(): number {
    const { cycleBase, anchorAudioTime, cps } = this.state;
    if (anchorAudioTime === null) return cycleBase;
    return cycleBase + (oscClient.clock.audioTime() - anchorAudioTime) * cps;
  }

  /** Elapsed played seconds (tempo-change-proof — its own accumulator). */
  seconds(): number {
    const { secondsBase, anchorAudioTime } = this.state;
    if (anchorAudioTime === null) return secondsBase;
    return secondsBase + (oscClient.clock.audioTime() - anchorAudioTime);
  }

  async play(): Promise<void> {
    const { state } = this.state;
    if (!oscClient.connected.get() || state === "playing") return;
    if (state === "stopped") {
      // A stop unloaded the plugins (killed their voices) — reload them
      // into the still-paused group: voices are born frozen, and the
      // /n_run below starts everything on the same block.
      await Promise.all(this.plugins().map((host) => host.load()));
      oscClient.setNodeRun(oscClient.sessionGroupId, 1);
    } else {
      oscClient.setNodeRun(oscClient.sessionGroupId, 1);
      for (const w of this.strudels()) w.conductorResume();
    }
    this.slice.update((s) => ({
      ...s,
      state: "playing",
      anchorAudioTime: oscClient.clock.audioTime(),
    }));
  }

  pause(): void {
    if (this.state.state !== "playing") return;
    oscClient.setNodeRun(oscClient.sessionGroupId, 0);
    for (const w of this.strudels()) w.conductorFreeze();
    this.slice.update((s) => ({
      ...s,
      state: "paused",
      cycleBase: this.cycle(),
      secondsBase: this.seconds(),
      anchorAudioTime: null,
    }));
  }

  stop(): void {
    if (!oscClient.connected.get() || this.state.state === "stopped") return;
    oscClient.setNodeRun(oscClient.sessionGroupId, 0);
    for (const host of this.plugins()) host.unload();
    this.slice.update((s) => ({ ...s, ...IDLE }));
  }

  /** Set the session tempo (header or Strudel — last writer wins).
   *  Re-anchors the cycle position so the change is slope-only, and
   *  pushes the new cps to every mounted mirror. */
  setCps(cps: number): void {
    if (!Number.isFinite(cps) || cps <= 0 || cps === this.state.cps) return;
    this.slice.update((s) => ({
      ...s,
      cps,
      cycleBase: this.cycle(),
      secondsBase: this.seconds(),
      anchorAudioTime: s.anchorAudioTime === null ? null : oscClient.clock.audioTime(),
    }));
    for (const w of this.strudels()) w.conductorSetCps(cps);
  }

  /** A pattern's own setcps() reached us through the wrapped scheduler
   *  (sc-strudel) — adopt it as the session tempo. */
  onCpsFromStrudel(cps: number): void {
    this.setCps(cps);
  }

  private plugins(): ScPlugin[] {
    return [...document.querySelectorAll<ScPlugin>(ELEMENTS.SC_PLUGIN)];
  }

  private strudels(): ScStrudel[] {
    return [...document.querySelectorAll<ScStrudel>(ELEMENTS.SC_STRUDEL)];
  }
}

/** The one conductor for the whole frontend. */
export const conductor = new Conductor();
