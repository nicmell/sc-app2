// <sc-scope> — a waveform view of `channels` consecutive audio buses starting
// at `bus` (defaults: the stereo master out), showing a window of `frames`
// samples (the visible time span = frames/sampleRate; the slot completes —
// and the view refreshes — at the inverse rate, so bigger windows page
// rather than flow). The element owns its whole tap
// through the load pass: load() installs the tap synthdef (ScopeOut2 into a
// scope-buffer slot allocated from the session's span), creates the tap synth
// at the tail of the SESSION group (it reads post-everything as of load time —
// plugins mounted later append after it, the same ordering caveat the old
// global controller had), and subscribes to the bridge's /scope/chunk stream
// filtered by its own subId; unload() reverses all of it, so the connection
// lifecycle (disconnect → unload, reconnect → reload) re-arms taps for free.
//
// Display props (renderer-only — the tap/wire carry the same chunks):
// `trigger` (auto|normal|off), `slope` (rising|falling) + `level` pin the
// drawn window to a level crossing on lane 0 like a bench scope's edge
// trigger (see lib/scope/trigger.ts and scope.md §5); `gain` scales the
// vertical axis; `layout` (overlay|split) stacks the lanes into per-channel
// bands instead of superimposing them.
//
// The canvas + RAF loop render the latest chunk. Light DOM (no shadow) so
// ui-components tokens + the .sc-scope CSS apply; styled in App.css.

import { html } from "lit";
import type { DecodedScopeChunk } from "@sc-app/server-commands";
import { compileScopeTapSynthDef, scopeTapSynthDefName } from "@/lib/scope/scopeTapSynthDef";
import { findTriggerOffset } from "@/lib/scope/trigger";
import { oscClient } from "@/stores/osc";
import { ScElement } from "@/sc-elements/internal/sc-element";
import styles from "./sc-scope.module.scss";

/** Padding factor: ±1 (after `gain`) maps to this fraction of the lane. */
const PAD = 0.9;

/** One resolved draw: which chunk, from which sample, how many samples. */
interface DrawWindow {
  chunk: DecodedScopeChunk;
  offset: number;
  span: number;
}

export class ScScope extends ScElement {
  // Declarative attributes are coerced and defaulted by getProp; enum
  // membership, numeric lexical gates, and the static range facets are
  // enforced by validation.ts's validateProps.

  // ── Runtime values (the element IS the runtime) ─────────────────────────
  /** Latest decoded chunk; the RAF loop reads it. */
  readonly chunkRef: { current: DecodedScopeChunk | null } = { current: null };
  loaded = false;
  private tapNodeId = 0;
  private scopeIdx = -1;
  /** The chunk stream handle (subId + the off that also stops it). */
  private stream?: { subId: number; off: () => void };

  /** Install + start the tap and subscribe its chunk stream. */
  async load(): Promise<void> {
    const live = this.loadGuard();
    // Wire runtime display props before installing the tap. ScElement's
    // synchronous load prefix performs the initial recompute + subscriptions.
    await super.load();
    if (!this.isConnected || this.loaded) return;
    if (!live()) return;

    const scopeIdx = oscClient.allocScopeIndex();
    let tapNodeId = 0;
    let stream: ReturnType<typeof oscClient.subscribeScope> | undefined;
    const release = () => {
      stream?.off();
      if (tapNodeId !== 0) oscClient.freeSynth(tapNodeId);
      oscClient.freeScopeIndex(scopeIdx);
    };

    try {
      await oscClient.sendSynthDef(
        compileScopeTapSynthDef(
          this.getProp("channels") as number,
          this.getProp("frames") as number,
        ),
      );
      if (!this.isConnected || !live()) {
        release();
        return;
      }

      tapNodeId = await oscClient.createSynth(
        scopeTapSynthDefName(this.getProp("channels") as number, this.getProp("frames") as number),
        oscClient.sessionGroupId,
        { inBus: this.getProp("bus") as number, scopeNum: scopeIdx },
      );
      if (!this.isConnected || !live()) {
        release();
        return;
      }

      // Register the handler before the subscribe send (no arrival race),
      // then atomically adopt the fully-created resource set.
      stream = oscClient.subscribeScope(
        scopeIdx,
        this.getProp("channels") as number,
        this.getProp("frames") as number,
        (chunk) => {
          this.chunkRef.current = chunk;
        },
      );
      this.scopeIdx = scopeIdx;
      this.tapNodeId = tapNodeId;
      this.stream = stream;
      this.loaded = true;
    } catch (error) {
      release();
      throw error;
    }
  }

  /** The inverse of load(): stop the stream, free the tap + the slot. The
   *  sends drop harmlessly on a dead socket (connection loss — the bridge
   *  frees the session group anyway). */
  unload(): void {
    super.unload();
    if (!this.loaded) return;
    this.stream?.off(); // drops the handler + sends /scope/unsubscribe
    this.stream = undefined;
    oscClient.freeSynth(this.tapNodeId);
    oscClient.freeScopeIndex(this.scopeIdx);
    this.chunkRef.current = null;
    this.held = null;
    this.tapNodeId = 0;
    this.scopeIdx = -1;
    this.loaded = false;
  }

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private bg = "#15171b";
  private zero = "#262930";
  private chans = ["#8ab4f8", "#96f2a7"];
  /** What the canvas currently shows — the RAF loop repaints only when the
   *  chunk (each arrives as a fresh object) or the backing size changed:
   *  chunks land at ~47 Hz against a 60 Hz RAF, and a dark scope costs
   *  nothing. */
  private drawnChunk: DecodedScopeChunk | null = null;
  private drawnW = 0;
  private drawnH = 0;
  /** `normal` mode's hold: the last triggered window, redrawn while no new
   *  chunk triggers (a bench scope's "no trigger → keep the trace"). */
  private held: DrawWindow | null = null;

  // Light DOM: render into the element itself.

  render() {
    return html`<canvas class=${styles.canvas}></canvas>`;
  }

  firstUpdated(): void {
    this.canvas = this.querySelector("canvas");
    this.ctx = this.canvas?.getContext("2d") ?? null;
    const css = getComputedStyle(this);
    const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    this.bg = v("--color-surface-2", this.bg);
    this.zero = v("--color-border", this.zero);
    this.chans = [v("--color-tx", this.chans[0]), v("--color-rx", this.chans[1])];
    this.startLoop();
  }

  protected updated(): void {
    this.drawnW = 0; // a display prop may have changed — repaint next frame
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    cancelAnimationFrame(this.raf);
  }

  private startLoop(): void {
    const draw = () => {
      this.raf = requestAnimationFrame(draw);
      this.drawFrame();
    };
    this.raf = requestAnimationFrame(draw);
  }

  /** Resolve the latest chunk against the trigger props into the window to
   *  draw. Triggered modes reserve the chunk's first quarter as search
   *  headroom and display the remaining ¾ from the found crossing, so every
   *  trace starts at the same phase; signals whose period exceeds the
   *  headroom (or never cross the level) fall back per the mode. */
  private resolveWindow(chunk: DecodedScopeChunk): DrawWindow | null {
    // Hoisted once per call — getProp re-reads spec + attribute per access,
    // too heavy for the per-repaint path.
    const trigger = this.getProp("trigger") as string;
    const perChannel = (chunk.data.length / chunk.channels) | 0;
    if (perChannel < 2) return null;
    const headroom = perChannel >> 2;
    if (trigger === "off" || headroom === 0) {
      return { chunk, offset: 0, span: perChannel };
    }
    const offset = findTriggerOffset(
      chunk.data, // lane 0 = the planar chunk's first perChannel samples
      headroom,
      this.getProp("level") as number,
      (this.getProp("slope") as string) === "rising",
    );
    const span = perChannel - headroom;
    if (offset !== null) {
      this.held = { chunk, offset, span };
      return this.held;
    }
    if (trigger === "normal" && this.held && this.held.chunk.channels === chunk.channels) {
      return this.held; // hold the last triggered trace
    }
    return { chunk, offset: 0, span }; // auto fallback: free-run this chunk
  }

  private drawFrame(): void {
    const canvas = this.canvas;
    const ctx = this.ctx;
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    const chunk = this.chunkRef.current;
    if (chunk === this.drawnChunk && bw === this.drawnW && bh === this.drawnH) {
      return; // nothing new to paint this frame
    }
    this.drawnChunk = chunk;
    this.drawnW = bw;
    this.drawnH = bh;
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }

    // Display props hoisted once per frame — getProp re-reads spec +
    // attribute per access, too heavy inside the RAF repaint loop.
    const split = (this.getProp("layout") as string) === "split";
    const gain = this.getProp("gain") as number;

    const win = chunk && chunk.data.length >= 2 ? this.resolveWindow(chunk) : null;
    const bands = win && split ? win.chunk.channels : 1;
    const bandH = h / bands;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, w, h);

    // The zero line: band middle for bipolar, the padded band bottom for
    // unipolar (where the full band spans [0, 1]).
    const unipolar = (this.getProp("range") as string) === "unipolar";
    const zeroOf = (band: number): number =>
      band * bandH + (unipolar ? bandH * (1 + PAD) * 0.5 : bandH / 2);
    ctx.strokeStyle = this.zero;
    ctx.lineWidth = 1;
    for (let b = 0; b < bands; b++) {
      const zy = zeroOf(b);
      ctx.beginPath();
      ctx.moveTo(0, zy);
      ctx.lineTo(w, zy);
      ctx.stroke();
    }

    if (!win || win.span < 2) return;
    const { data, channels } = win.chunk;
    const perChannel = (win.chunk.data.length / channels) | 0;

    const xStep = w / (win.span - 1);
    ctx.lineWidth = 1.25;
    for (let c = 0; c < channels; c++) {
      const mid = zeroOf(split ? c : 0);
      const yScale = gain * PAD * (unipolar ? bandH : bandH / 2);
      ctx.save();
      if (split) {
        // Keep an over-gained lane inside its own band.
        ctx.beginPath();
        ctx.rect(0, c * bandH, w, bandH);
        ctx.clip();
      }
      ctx.strokeStyle = this.chans[c % this.chans.length];
      ctx.beginPath();
      for (let i = 0; i < win.span; i++) {
        // The chunk is PLANAR (scsynth's scope_buffer layout: one contiguous
        // frame run per channel), not interleaved.
        const sample = data[c * perChannel + win.offset + i];
        const x = i * xStep;
        const y = mid - sample * yScale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}
