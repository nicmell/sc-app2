/**
 * The software trigger for <sc-scope> — the edge-trigger search of a bench
 * oscilloscope, reduced to one pass over a chunk's first lane.
 *
 * A free-running scope draws each chunk from sample 0, so the waveform enters
 * the window at an arbitrary phase and the trace drifts (or ghosts into N
 * superimposed copies when the per-chunk phase step is near 1/N of a cycle).
 * Triggering pins the drawn window to a level crossing instead: every trace
 * starts at the same phase and a periodic signal stands still.
 *
 * Conventions (mirroring scope literature):
 * - the trigger SOURCE is lane 0; all lanes are drawn at the found offset so
 *   they stay time-aligned (a bench scope sweeps every channel off ch 1);
 * - SLOPE is the crossing direction, LEVEL the threshold;
 * - HYSTERESIS arms the trigger: the signal must first retreat past
 *   `level ∓ hysteresis` (below for rising, above for falling) before a
 *   crossing fires, so noise riding on the waveform near the level can't
 *   false-trigger.
 */

/** Arming margin around the trigger level (full-scale units, ±1 audio). */
export const TRIGGER_HYSTERESIS = 0.02;

/**
 * Find the first qualifying level crossing in `lane[0..searchEnd]`.
 *
 * `searchEnd` is the last index allowed to fire — the caller reserves
 * `window` samples of the lane after it for drawing. Returns the index of
 * the first sample at/past the level with the signal previously armed, or
 * `null` when the search range holds no qualifying crossing (signal period
 * longer than the headroom, DC, or silence).
 */
export function findTriggerOffset(
  lane: ArrayLike<number>,
  searchEnd: number,
  level: number,
  rising: boolean,
  hysteresis: number = TRIGGER_HYSTERESIS,
): number | null {
  const end = Math.min(searchEnd, lane.length - 1);
  let armed = false;
  for (let i = 0; i <= end; i++) {
    const v = lane[i];
    if (rising ? v <= level - hysteresis : v >= level + hysteresis) {
      armed = true;
    } else if (armed && (rising ? v >= level : v <= level)) {
      return i;
    }
  }
  return null;
}
