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
// The canvas + RAF loop render the latest chunk. Light DOM (no shadow) so
// ui-foundation tokens + the .sc-scope CSS apply; styled in App.css.

import { html } from "lit";
import { property } from "lit/decorators.js";
import type { DecodedScopeChunk } from "@sc-app/server-commands";
import { SCOPE_CHANNELS, SCOPE_CHUNK_SIZE, SCOPE_INPUT_BUS, SCOPE_MAX_FRAMES } from "@/constants/osc";
import { compileScopeTapSynthDef, scopeTapSynthDefName } from "@/lib/scope/scopeTapSynthDef";
import { oscClient } from "@/stores/osc";
import { failValidation, requireNoScChildren, requireNumeric } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

/** Vertical gain applied to the ±1 sample range before drawing. */
const GAIN = 0.9;

export class ScScope extends ScElement {
  /** First audio bus the tap reads. */
  @property({ type: Number }) accessor bus = SCOPE_INPUT_BUS;
  /** How many consecutive buses (from `bus`) the tap reads. */
  @property({ type: Number }) accessor channels = SCOPE_CHANNELS;
  /** Frames per chunk = the visible window (frames/sampleRate seconds). */
  @property({ type: Number }) accessor frames = SCOPE_CHUNK_SIZE;

  // ── Runtime values (the element IS the runtime) ─────────────────────────
  /** Latest decoded chunk; the RAF loop reads it. */
  readonly chunkRef: { current: DecodedScopeChunk | null } = { current: null };
  loaded = false;
  private tapNodeId = 0;
  private scopeIdx = -1;
  /** The chunk stream handle (subId + the off that also stops it). */
  private stream?: { subId: number; off: () => void };

  validate(): void {
    requireNoScChildren(this);
    requireNumeric(this, "bus", this.bus);
    requireNumeric(this, "channels", this.channels);
    if (!Number.isInteger(this.bus) || this.bus < 0) {
      failValidation(this, `"bus" attribute must be a non-negative integer (got "${this.bus}")`);
    }
    if (!Number.isInteger(this.channels) || this.channels < 1) {
      failValidation(this, `"channels" attribute must be a positive integer (got "${this.channels}")`);
    }
    requireNumeric(this, "frames", this.frames);
    if (!Number.isInteger(this.frames) || this.frames < 1) {
      failValidation(this, `"frames" attribute must be a positive integer (got "${this.frames}")`);
    }
    if (this.frames > SCOPE_MAX_FRAMES) {
      failValidation(this, `"frames" attribute must be ≤ ${SCOPE_MAX_FRAMES} (got "${this.frames}")`);
    }
  }

  /** Install + start the tap and subscribe its chunk stream. */
  async load(): Promise<void> {
    if (!this.isConnected || this.loaded) return;
    this.scopeIdx = oscClient.allocScopeIndex();
    await oscClient.sendSynthDef(compileScopeTapSynthDef(this.channels, this.frames));
    this.tapNodeId = await oscClient.createSynth(
      scopeTapSynthDefName(this.channels, this.frames),
      oscClient.sessionGroupId,
      { inBus: this.bus, scopeNum: this.scopeIdx },
    );
    // One call wires the whole stream: the handler is registered under the
    // minted subId before the subscribe goes out, and dispatch is keyed.
    this.stream = oscClient.subscribeScope(this.scopeIdx, this.channels, this.frames, (chunk) => {
      this.chunkRef.current = chunk;
    });
    this.loaded = true;
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

  // Light DOM: render into the element itself.

  render() {
    return html`<canvas class="sc-scope-canvas"></canvas>`;
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

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = this.zero;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (!chunk || chunk.data.length < 2) return;
    const { data, channels } = chunk;
    const perChannel = (data.length / channels) | 0;
    if (perChannel < 2) return;

    const xStep = w / (perChannel - 1);
    const mid = h / 2;
    ctx.lineWidth = 1.25;
    for (let c = 0; c < channels; c++) {
      ctx.strokeStyle = this.chans[c % this.chans.length];
      ctx.beginPath();
      for (let i = 0; i < perChannel; i++) {
        // The chunk is PLANAR (scsynth's scope_buffer layout: one contiguous
        // frame run per channel), not interleaved.
        const sample = data[c * perChannel + i];
        const x = i * xStep;
        const y = mid - sample * GAIN * mid;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}
