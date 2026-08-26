// Step-precision helpers shared by the numeric controls (ScRangeBase's
// drag/wheel quantise + aria valuetext, ScInputNumberBase's steppers).
//
// The former per-component formula — `Math.round(-Math.log10(step))` — only
// yields a grid at least as fine as the step for (near-)power-of-10 steps:
// step 0.5 re-rounded to integers, step 0.05 to tenths, so odd multiples of
// the step were unreachable. Precision here follows the step's (and anchor's)
// actual decimal places instead.

/** Decimal places implied by a number's canonical string ("0.05" → 2, "1e-7" → 7). */
export function decimalsOf(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const [mantissa, exponent] = String(Math.abs(n)).split("e-");
  const dot = mantissa.indexOf(".");
  return (dot === -1 ? 0 : mantissa.length - dot - 1) + (exponent ? Number(exponent) : 0);
}

/** Round `n` to `decimals` places (float-tail cleanup after grid arithmetic). */
function roundTo(n: number, decimals: number): number {
  const factor = 10 ** Math.min(15, Math.max(0, decimals));
  return Math.round(n * factor) / factor;
}

/** Snap `raw` onto the `step` grid anchored at `min` (at 0 when min is not
 *  finite), clean the float tail at the grid's own precision, and clamp to
 *  [min, max]. */
export function quantize(raw: number, min: number, max: number, step: number): number {
  if (!Number.isFinite(step) || step <= 0) return Math.max(min, Math.min(max, raw));
  const anchor = Number.isFinite(min) ? min : 0;
  let v = Math.round((raw - anchor) / step) * step + anchor;
  v = roundTo(v, decimalsOf(step) + decimalsOf(anchor));
  return Math.max(min, Math.min(max, v));
}
