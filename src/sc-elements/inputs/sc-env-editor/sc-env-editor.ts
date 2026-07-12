// <sc-env-editor> — the draggable-breakpoint envelope editor. An ScInput
// whose bound target is an ordinary ARRAY-valued control/var holding an
// Env.asArray encoding: `syncFromState` DECODES the flat array into
// breakpoints and repaints; every gesture ENCODES a fresh array (same width
// — the bound array's size caps the segment budget) through the shared
// commit path (→ the state's store write + its /n_set(n) dispatch).
//
// Interactions:
//   drag a breakpoint      → level (y) + the segment's time (x, clamped > 0;
//                            the start point moves level-only)
//   double-click a segment → insert a breakpoint (within the target env's
//                            max-segments budget)
//   double-click a point   → remove it (≥ 1 segment kept; a removed release
//                            segment's flag moves to the new last segment)
//   drag a segment MIDPOINT vertically → bend its curvature (numeric, ±10;
//                            a symbolic curve becomes numeric once dragged)
//
// Canvas per the sc-scope scaffold: light DOM, DPR-aware backing store, CSS
// custom-property colors; drawn on demand (sync/edit/resize) — no RAF loop —
// with pointermove commits coalesced through requestAnimationFrame.

import { html } from "lit";
import {
  decodeEnvArray,
  encodeEnvArray,
  type EnvBreakpoints,
  type EnvSegment,
} from "@/lib/synthdef/envValue";
import type { StateValue } from "@/types/runtime";
import { failValidation } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";
import type { ScState } from "@/sc-elements/internal/sc-state";
import styles from "./sc-env-editor.module.scss";

const PAD = 10; // px inset around the drawing area
const HIT_RADIUS = 10; // px hit-test radius for points and curve handles
const MIN_TIME = 0.005; // s — a dragged segment can't collapse to zero
const CURVE_LIMIT = 10;
/** Hard bound on a drawn LEVEL. Over-unity envelopes are legal (pitch/depth
 *  curves), runaway ones are not: with pointer capture a drag past the
 *  canvas edge maps outside [lo, hi], the auto-expanding scale would grow to
 *  include it, and the SAME pixel offset then maps further out — an
 *  exponential feedback (×2 per RAF commit) that reached 1e19 in the wild.
 *  The gesture-frozen scale kills the loop; this clamp caps the damage of
 *  any single gesture AND lets a corrupted envelope heal on its next drag. */
const LEVEL_LIMIT = 16;

const clampLevel = (v: number): number =>
  Math.max(-LEVEL_LIMIT, Math.min(LEVEL_LIMIT, Number.isFinite(v) ? v : 0));

/** Hard bound on ONE segment's duration — the time axis has the same
 *  ratcheting exposure (a drag past the right edge grows `total`, and the
 *  next gesture's scale multiplies from there). */
const TIME_LIMIT = 60;

const clampTime = (v: number): number =>
  Math.max(MIN_TIME, Math.min(TIME_LIMIT, Number.isFinite(v) ? v : MIN_TIME));
/** Safety margin added to the derived `hold` output (s) — the gate must
 *  outlive the pre-release ramp by at least one control period. */
const HOLD_MARGIN = 0.02;

/** The gate-hold a retrigger rig needs: the time the envelope takes to reach
 *  its release point (Σ segment times before the release-flagged segment;
 *  the WHOLE envelope when nothing is flagged — no sustain to hold at). */
export function preReleaseTime(value: EnvBreakpoints): number {
  let sum = 0;
  for (const s of value.segments) {
    if (s.release) return sum;
    sum += s.time;
  }
  return sum;
}

/** One sampled point of a segment's shape, sclang's Env curve semantics:
 *  numeric curvature bends via the exponential-mix formula; the symbolic
 *  shapes get their canonical (or approximated) forms. */
function curvePoint(a: number, b: number, curve: number | string | undefined, p: number): number {
  if (typeof curve === "number" && Math.abs(curve) > 0.001) {
    return a + ((b - a) * (1 - Math.exp(p * curve))) / (1 - Math.exp(curve));
  }
  switch (curve) {
    case "step":
      return p > 0 ? b : a;
    case "hold":
      return p < 1 ? a : b;
    case "exp":
    case "exponential":
      return a !== 0 && b !== 0 && a * b > 0 ? a * Math.pow(b / a, p) : a + (b - a) * p;
    case "sin":
    case "sine":
      return a + ((b - a) * (1 - Math.cos(Math.PI * p))) / 2;
    default:
      return a + (b - a) * p; // lin + unhandled shapes approximate linearly
  }
}

type Drag =
  | { kind: "point"; index: number } // 0 = the start point, i = segment i-1's end
  | { kind: "curve"; index: number; startY: number; startCurve: number };

export class ScEnvEditor extends ScInput {
  protected validateRuntimeProps(): void {
    // Like sc-button: write-capable, so it needs a plain writable path — and
    // specifically an envelope state (a scalar control has no shape to drag).
    const target = this.targetScState;
    if (!target || target.runtimeProps?.value !== undefined) {
      failValidation(this, `"bind:value" must reference a single writable envelope state`);
    }
    const declared = target.getProp("value");
    if (!Array.isArray(declared)) {
      failValidation(this, `"bind:value" must reference an ARRAY-valued control/var`);
    }
    // The bound width is the encode target — anything under the 4-slot
    // Env.asArray header can hold no envelope at all.
    if (declared.length < 8) {
      failValidation(
        this,
        `"bind:value" envelope array needs at least 8 slots — a 4-slot header + one 4-slot segment (got ${declared.length})`,
      );
    }
    // `hold` is a derived OUTPUT — bind: form only, and like every write
    // seam it needs a plain single-path bind to WRITABLE (underived) state.
    if (this.getAttribute("hold") !== null) {
      failValidation(this, `"hold" supports only the bind: form (bind:hold="…")`);
    }
    if (this.runtimeProps?.hold && !this.holdTarget) {
      failValidation(this, `"bind:hold" must reference a single writable control/var`);
    }
  }

  /** The `hold` write target: a plain single-path bind to underived state
   *  (mirrors `targetScState` for the `value` prop). */
  private get holdTarget(): ScState | undefined {
    const prop = this.runtimeProps?.hold;
    if (!prop || prop.expression) return undefined;
    const targets = Object.values(prop.targets);
    const target = targets.length === 1 ? targets[0] : undefined;
    return target && target.runtimeProps?.value === undefined ? target : undefined;
  }

  /** Publish the derived gate-hold for the CURRENT envelope. Called from
   *  syncFromState, so both the editor's own commits (via the statechange
   *  echo) and external envelope writes keep it honest; the state write is
   *  Object.is-guarded, so an unchanged hold sends nothing. */
  private publishHold(value: EnvBreakpoints): void {
    this.holdTarget?.setValue(+(preReleaseTime(value) + HOLD_MARGIN).toFixed(4));
  }

  // ── live model ───────────────────────────────────────────────────────────
  private value: EnvBreakpoints | null = null;
  /** The bound array's width — the encode target and the segment budget. */
  private width = 0;
  private drag: Drag | null = null;
  private pendingCommit: EnvBreakpoints | null = null;
  private raf = 0;

  protected syncFromState(value: StateValue | undefined): void {
    if (!Array.isArray(value)) return;
    this.width = value.length;
    this.value = decodeEnvArray(value);
    this.publishHold(this.value);
    this.draw();
  }

  /** Programmatic edit seam (also the unit-test surface): transform the
   *  current breakpoints and commit the fresh ENCODED array. Encode FIRST —
   *  an over-capacity edit throws without corrupting the local model. */
  applyEdit(edit: (value: EnvBreakpoints) => EnvBreakpoints): void {
    if (!this.value) return;
    const next = edit(this.value);
    const encoded = encodeEnvArray(next, this.width);
    this.value = next;
    this.commit(encoded);
    this.draw();
  }

  // ── geometry ─────────────────────────────────────────────────────────────

  private get levels(): number[] {
    const v = this.value!;
    return [v.start, ...v.segments.map((s) => s.to)];
  }

  /** Cumulative breakpoint times (t0 = 0). */
  private get times(): number[] {
    const out = [0];
    for (const s of this.value!.segments) out.push(out[out.length - 1] + s.time);
    return out;
  }

  /** The scale FROZEN for a whole drag gesture — recomputing per move would
   *  feed dragged-out-of-range levels back into [lo, hi] exponentially. */
  private dragFrame: { w: number; h: number; lo: number; hi: number; total: number } | null = null;

  private frame(): { w: number; h: number; lo: number; hi: number; total: number } {
    if (this.dragFrame) return this.dragFrame;
    const canvas = this.canvas!;
    const w = canvas.clientWidth - PAD * 2;
    const h = canvas.clientHeight - PAD * 2;
    const levels = this.levels;
    const lo = Math.min(0, ...levels);
    // ABSOLUTE scale: the unit band is always visible, growing only for
    // over-unity levels. Auto-zooming to the data made a collapsed envelope
    // (everything dragged near 0 → near-silence) look full-size.
    const hi = Math.max(1, ...levels);
    const total = Math.max(this.times[this.times.length - 1], MIN_TIME);
    return { w, h, lo, hi, total };
  }

  private toX(t: number): number {
    const { w, total } = this.frame();
    return PAD + (t / total) * w;
  }

  private toY(level: number): number {
    const { h, lo, hi } = this.frame();
    return PAD + h - ((level - lo) / (hi - lo)) * h;
  }

  private fromX(x: number): number {
    const { w, total } = this.frame();
    return ((x - PAD) / w) * total;
  }

  private fromY(y: number): number {
    const { h, lo, hi } = this.frame();
    return lo + ((PAD + h - y) / h) * (hi - lo);
  }

  // ── interactions ─────────────────────────────────────────────────────────

  /** The breakpoint index within HIT_RADIUS of (x, y), or null. */
  private hitPoint(x: number, y: number): number | null {
    if (!this.value) return null;
    const times = this.times;
    const levels = this.levels;
    for (let i = 0; i < times.length; i++) {
      if (Math.hypot(this.toX(times[i]) - x, this.toY(levels[i]) - y) <= HIT_RADIUS) return i;
    }
    return null;
  }

  /** The segment whose curve MIDPOINT is within HIT_RADIUS, or null. */
  private hitCurveHandle(x: number, y: number): number | null {
    if (!this.value) return null;
    const times = this.times;
    const levels = this.levels;
    for (let i = 0; i < this.value.segments.length; i++) {
      const midT = (times[i] + times[i + 1]) / 2;
      const midLevel = curvePoint(levels[i], levels[i + 1], this.value.segments[i].curve, 0.5);
      if (Math.hypot(this.toX(midT) - x, this.toY(midLevel) - y) <= HIT_RADIUS) return i;
    }
    return null;
  }

  /** The segment index the x position falls into (for inserts). */
  private segmentAt(x: number): number {
    const t = this.fromX(x);
    const times = this.times;
    for (let i = 0; i < times.length - 1; i++) {
      if (t < times[i + 1]) return i;
    }
    return this.value!.segments.length - 1;
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (!this.value) return;
    const { x, y } = this.local(e);
    const point = this.hitPoint(x, y);
    if (point !== null) {
      this.drag = { kind: "point", index: point };
    } else {
      const handle = this.hitCurveHandle(x, y);
      if (handle === null) return;
      const curve = this.value.segments[handle].curve;
      this.drag = {
        kind: "curve",
        index: handle,
        startY: y,
        startCurve: typeof curve === "number" ? curve : 0,
      };
    }
    this.dragFrame = this.frame(); // freeze the scale for the whole gesture
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.drag || !this.value) return;
    const { x, y } = this.local(e);
    const next =
      this.drag.kind === "point"
        ? this.dragPoint(this.drag.index, x, y)
        : this.dragCurve(this.drag.index, y);
    this.value = next;
    this.draw();
    // Coalesce the /c_setn stream through RAF — one commit per frame.
    this.pendingCommit = next;
    if (!this.raf) {
      this.raf = requestAnimationFrame(() => {
        this.raf = 0;
        if (this.pendingCommit) this.commit(encodeEnvArray(this.pendingCommit, this.width));
        this.pendingCommit = null;
      });
    }
  };

  private onPointerUp = (): void => {
    if (this.pendingCommit) {
      this.commit(encodeEnvArray(this.pendingCommit, this.width));
      this.pendingCommit = null;
    }
    this.drag = null;
    this.dragFrame = null;
    this.draw(); // redraw on the live scale (a level may have moved lo/hi)
  };

  private onDblClick = (e: MouseEvent): void => {
    if (!this.value) return;
    const { x, y } = this.local(e);
    const point = this.hitPoint(x, y);
    if (point !== null && point > 0 && this.value.segments.length > 1) {
      this.applyEdit((v) => removePoint(v, point));
      return;
    }
    if (point === null) {
      const budget = Math.floor((this.width - 4) / 4);
      if (this.value.segments.length >= budget) return;
      this.applyEdit((v) => insertPoint(v, this.segmentAt(x), this.fromX(x), clampLevel(this.fromY(y))));
    }
  };

  private dragPoint(index: number, x: number, y: number): EnvBreakpoints {
    const v = this.value!;
    const level = clampLevel(this.fromY(y));
    if (index === 0) return { ...v, start: level };
    const times = this.times;
    const seg = index - 1;
    // The dragged breakpoint moves its own segment's duration; later
    // breakpoints slide with it (their durations are untouched).
    const time = clampTime(this.fromX(x) - times[seg]);
    return {
      ...v,
      segments: v.segments.map((s, i) => (i === seg ? { ...s, to: level, time } : s)),
    };
  }

  private dragCurve(index: number, y: number): EnvBreakpoints {
    const v = this.value!;
    const drag = this.drag as Extract<Drag, { kind: "curve" }>;
    const delta = (drag.startY - y) * 0.05; // drag up → bend positive
    const curve = Math.max(-CURVE_LIMIT, Math.min(CURVE_LIMIT, drag.startCurve + delta));
    return {
      ...v,
      segments: v.segments.map((s, i) => (i === index ? { ...s, curve } : s)),
    };
  }

  private local(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // ── canvas scaffold (the sc-scope pattern) ───────────────────────────────

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private bg = "#15171b";
  private grid = "#262930";
  private line = "#8ab4f8";
  private accent = "#96f2a7";

  render() {
    return html`<canvas
      class=${styles.canvas}
      @pointerdown=${this.onPointerDown}
      @pointermove=${this.onPointerMove}
      @pointerup=${this.onPointerUp}
      @pointercancel=${this.onPointerUp}
      @dblclick=${this.onDblClick}
    ></canvas>`;
  }

  firstUpdated(): void {
    this.canvas = this.querySelector("canvas");
    this.ctx = this.canvas?.getContext("2d") ?? null;
    const css = getComputedStyle(this);
    const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    this.bg = v("--color-surface-2", this.bg);
    this.grid = v("--color-border", this.grid);
    this.line = v("--color-tx", this.line);
    this.accent = v("--color-rx", this.accent);
    if (typeof ResizeObserver !== "undefined" && this.canvas) {
      this.resizeObserver = new ResizeObserver(() => this.draw());
      this.resizeObserver.observe(this.canvas);
    }
    this.draw();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private draw(): void {
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
    if (!this.value) return;

    const zeroY = this.toY(0);
    ctx.strokeStyle = this.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, zeroY);
    ctx.lineTo(w - PAD, zeroY);
    ctx.stroke();

    const times = this.times;
    const levels = this.levels;
    // Segment paths, sampled through the curve formula.
    ctx.strokeStyle = this.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.toX(times[0]), this.toY(levels[0]));
    for (let i = 0; i < this.value.segments.length; i++) {
      const steps = 24;
      for (let s = 1; s <= steps; s++) {
        const p = s / steps;
        const t = times[i] + (times[i + 1] - times[i]) * p;
        const level = curvePoint(levels[i], levels[i + 1], this.value.segments[i].curve, p);
        ctx.lineTo(this.toX(t), this.toY(level));
      }
    }
    ctx.stroke();

    // Curve handles (midpoints), then breakpoints on top.
    for (let i = 0; i < this.value.segments.length; i++) {
      const midT = (times[i] + times[i + 1]) / 2;
      const midLevel = curvePoint(levels[i], levels[i + 1], this.value.segments[i].curve, 0.5);
      ctx.fillStyle = this.grid;
      ctx.beginPath();
      ctx.arc(this.toX(midT), this.toY(midLevel), 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < times.length; i++) {
      const release = i > 0 && this.value.segments[i - 1].release;
      ctx.fillStyle = release ? this.accent : this.line;
      ctx.beginPath();
      ctx.arc(this.toX(times[i]), this.toY(levels[i]), 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── pure edit helpers (exported for the unit tests) ────────────────────────

/** Remove breakpoint `index` (≥ 1): its two adjoining segments merge — the
 *  merged segment keeps the SECOND's target level over the summed duration
 *  and INHERITS the removed segment's release/loop flags (dropping the
 *  release point silently would leave a no-release envelope whose voices
 *  self-free at a nonzero level — a click on every note). Removing the last
 *  point keeps the envelope closed by moving the release flag (if it was
 *  there) to the new last segment. */
export function removePoint(value: EnvBreakpoints, index: number): EnvBreakpoints {
  const seg = index - 1;
  const removed = value.segments[seg];
  const segments: EnvSegment[] = value.segments.flatMap((s, i) => {
    if (i === seg) return [];
    if (i === seg + 1) {
      return [
        {
          ...s,
          time: s.time + removed.time,
          release: s.release || removed.release || undefined,
          loop: s.loop || removed.loop || undefined,
        },
      ];
    }
    return [s];
  });
  // Dropping the LAST point: the removed segment simply disappears — restore
  // its release flag onto the new last segment so a gated envelope stays
  // releasable.
  if (seg === value.segments.length - 1 && removed.release && segments.length > 0) {
    segments[segments.length - 1] = { ...segments[segments.length - 1], release: true };
  }
  return { ...value, segments };
}

/** Split segment `index` at time `t` (absolute) with the new point at
 *  `level`: the first half is a new lin-ish segment, the second keeps the
 *  original's target/curve/flags. */
export function insertPoint(value: EnvBreakpoints, index: number, t: number, level: number): EnvBreakpoints {
  const starts: number[] = [0];
  for (const s of value.segments) starts.push(starts[starts.length - 1] + s.time);
  const original = value.segments[index];
  const first = Math.max(MIN_TIME, t - starts[index]);
  const second = Math.max(MIN_TIME, original.time - first);
  const segments = value.segments.flatMap((s, i) =>
    i === index
      ? [
          { to: level, time: first, curve: s.curve },
          { ...s, time: second },
        ]
      : [s],
  );
  return { ...value, segments };
}
