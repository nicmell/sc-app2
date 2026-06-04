// Waveform renderer for the master-out scope. A requestAnimationFrame loop
// reads the latest chunk from a ref once per frame and traces each channel as a
// polyline (stereo overlay) — decoupled from chunk arrival (~47 Hz) and never
// touching React state, so it can't thrash renders.

import { useEffect, useRef } from "react";
import type { DecodedScopeChunk } from "@sc-app/server-commands";

/** Vertical gain applied to the ±1 sample range before drawing. */
const GAIN = 0.9;

export default function ScopeView({
  chunkRef,
}: {
  chunkRef: { current: DecodedScopeChunk | null };
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolve palette from ui-foundation tokens once.
    const css = getComputedStyle(canvas);
    const bg = css.getPropertyValue("--color-surface-2").trim() || "#15171b";
    const zero = css.getPropertyValue("--color-border").trim() || "#262930";
    const chanColors = [
      css.getPropertyValue("--color-tx").trim() || "#8ab4f8",
      css.getPropertyValue("--color-rx").trim() || "#96f2a7",
    ];

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);

      // Keep the backing store sized to the element (DPR-aware).
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
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Zero line.
      ctx.strokeStyle = zero;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const chunk = chunkRef.current;
      if (!chunk || chunk.data.length < 2) return;
      const { data, channels } = chunk;
      const perChannel = (data.length / channels) | 0;
      if (perChannel < 2) return;

      const xStep = w / (perChannel - 1);
      const mid = h / 2;
      ctx.lineWidth = 1.25;
      for (let c = 0; c < channels; c++) {
        ctx.strokeStyle = chanColors[c % chanColors.length];
        ctx.beginPath();
        for (let i = 0; i < perChannel; i++) {
          const v = data[i * channels + c];
          const x = i * xStep;
          const y = mid - v * GAIN * mid;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [chunkRef]);

  return <canvas ref={canvasRef} className="scope-canvas" />;
}
