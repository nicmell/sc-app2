// <sc-scope> — master-out waveform. Ports the old ScopeView: a canvas + RAF
// loop reading the latest scope chunk from the session's ScopeController. Light
// DOM (no shadow) so ui-foundation tokens + the .sc-scope CSS apply; styled in
// App.css. No attributes yet — customization comes later.

import { html } from "lit";
import { ScElement } from "@/sc-elements/internal/sc-element";
import { session } from "@/stores/session";

/** Vertical gain applied to the ±1 sample range before drawing. */
const GAIN = 0.9;

export class ScScope extends ScElement {
  validate(): void {
    this.requireNoScChildren();
  }

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private bg = "#15171b";
  private zero = "#262930";
  private chans = ["#8ab4f8", "#96f2a7"];

  // Light DOM: render into the element itself.

  render() {
    return html`<canvas class="sc-scope-canvas"></canvas>`;
  }

  firstUpdated(): void {
    super.firstUpdated();
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

    const chunk = session.scope?.chunkRef.current;
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
        const sample = data[i * channels + c];
        const x = i * xStep;
        const y = mid - sample * GAIN * mid;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}
