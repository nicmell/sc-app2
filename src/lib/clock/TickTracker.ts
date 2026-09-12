// The one-way audio-clock tracker (AUDIO-CLOCK.md §6 step 4): turns the
// `__global_clock__` synth's `/tr` phase payload into a measurable time
// source. Each tick carries the Phasor's position in its sample ring; the
// tracker unwraps it into an absolute tick index, regresses arrival times
// against the tick grid, and exposes
//
//   - `skewPpm`  — how fast the LOCAL clock runs against the audio clock,
//   - `audioNow` — the engine's current time (seconds), anchored on the
//                  minimum-residual arrival (NTP's min-filter philosophy,
//                  one-way: delivery delay only ever ADDS, so the least
//                  delayed arrival is the least biased anchor).
//
// Everything runs in ONE context (the main thread) over performance.now(),
// so the timeOrigin rule is untouched. Pure math + DI'd clock — composed
// by ClockSync, driven synthetically in tests.
//
// The unwrap is self-healing against UDP loss: the index is DERIVED from
// the local inter-arrival time and verified against the phase delta (the
// tick advances by exactly sampleRate/freq samples in-domain, quantized to
// scsynth's 64-sample control blocks — the per-tick delta ALTERNATES
// around the mean, hence the block-sized tolerance). An arrival no k can
// explain means the phase base jumped (engine or synth restart): the
// tracker resyncs and re-locks from scratch.

interface TickTrackerOptions {
  /** The tick rate (`CLOCK_TICK_FREQ_HZ`). */
  freqHz: number;
  /** The Phasor ring modulus (`PHASE_RING_FRAMES`). */
  ringFrames: number;
  monotonicNow?: () => number;
}

interface Point {
  n: number;
  a: number;
}

/** Ticks required after a (re)sync before estimates are exposed. */
const LOCK_MIN = 32;
/** Regression window, in ticks (~12.8 s at 20 Hz): long enough to resolve
 *  ~100 ppm skew through several ms of delivery jitter. */
const WINDOW = 256;
/** Phase-delta tolerance: Impulse.kr quantizes to 64-sample control
 *  blocks, so a single delta may sit two blocks off the running mean. */
const DELTA_TOLERANCE = 2 * 64;
/** EMA weight for the samples-per-tick estimate (the true value is fixed
 *  by sampleRate/freq; the EMA only irons out block quantization). */
const MEAN_DELTA_ALPHA = 0.05;
/** How far around the time-derived k the phase check searches (burst
 *  delivery can make inter-arrival times lie by a few ticks). */
const MAX_K_SEARCH = 3;

/** Distance on the phase circle. */
function circularDiff(a: number, b: number, ring: number): number {
  const d = Math.abs(a - b) % ring;
  return Math.min(d, ring - d);
}

export class TickTracker {
  private readonly freqHz: number;
  private readonly ring: number;
  private readonly monotonicNow: () => number;
  private readonly periodMs: number;

  private lastPhase: number | null = null;
  private lastArrival = 0;
  private n = 0;
  /** Samples per tick (≈ sampleRate/freq) — self-measured, no sample-rate
   *  assumption; survives a resync (the rate doesn't change with the
   *  phase base). */
  private meanDelta: number | null = null;
  private points: Point[] = [];
  private slope = 0;
  private anchor = 0;

  constructor({ freqHz, ringFrames, monotonicNow = () => performance.now() }: TickTrackerOptions) {
    this.freqHz = freqHz;
    this.ring = ringFrames;
    this.monotonicNow = monotonicNow;
    this.periodMs = 1000 / freqHz;
  }

  /** Fold one tick's phase payload in. */
  onTick(phase: number): void {
    if (!Number.isFinite(phase)) return;
    const a = this.monotonicNow();

    if (this.lastPhase === null) {
      this.rebase(phase, a);
      return;
    }

    const dp = (((phase - this.lastPhase) % this.ring) + this.ring) % this.ring;
    const kTime = Math.max(1, Math.round((a - this.lastArrival) / this.periodMs));

    if (this.meanDelta === null) {
      // Seeding: only a clean consecutive pair can establish the rate.
      if (kTime === 1 && dp > 0) {
        this.meanDelta = dp;
        this.advance(1, a, phase);
      } else {
        this.rebase(phase, a);
      }
      return;
    }

    const k = this.matchK(dp, kTime);
    if (k === null) {
      // No k explains the phase — the base jumped (engine/synth restart).
      this.rebase(phase, a);
      return;
    }

    // Reconstruct the true per-tick delta (unwrap the ring) and refine the
    // rate estimate.
    const wraps = Math.round((k * this.meanDelta - dp) / this.ring);
    const trueDelta = (dp + wraps * this.ring) / k;
    this.meanDelta += MEAN_DELTA_ALPHA * (trueDelta - this.meanDelta);
    this.advance(k, a, phase);
  }

  /** Forget everything (socket closed). The rate estimate survives — it is
   *  a property of the engine, not of the connection. */
  reset(): void {
    this.lastPhase = null;
    this.n = 0;
    this.points = [];
  }

  get locked(): boolean {
    return this.points.length >= LOCK_MIN;
  }

  /** Absolute tick index since the last (re)sync — null until locked. */
  get tickIndex(): number | null {
    return this.locked ? this.n : null;
  }

  /** How fast the local clock runs against the audio clock, in parts per
   *  million — null until locked. */
  get skewPpm(): number | null {
    if (!this.locked) return null;
    return (this.slope / this.periodMs - 1) * 1e6;
  }

  /** The audio engine's current time in SECONDS since the last (re)sync,
   *  estimated one-way — null until locked. NOT guaranteed monotonic
   *  across refits (why Strudel's getTime does not consume this yet). */
  audioNow(): number | null {
    if (!this.locked) return null;
    const ticksNow = (this.monotonicNow() - this.anchor) / this.slope;
    return ticksNow / this.freqHz;
  }

  /** Find the k (number of elapsed ticks) whose expected phase advance
   *  matches the observed one, searching outward from the time-derived
   *  guess. */
  private matchK(dp: number, kTime: number): number | null {
    const delta = this.meanDelta as number;
    for (let offset = 0; offset <= MAX_K_SEARCH; offset++) {
      for (const k of offset === 0 ? [kTime] : [kTime - offset, kTime + offset]) {
        if (k < 1) continue;
        const expected = (k * delta) % this.ring;
        if (circularDiff(dp, expected, this.ring) <= DELTA_TOLERANCE * Math.min(k, 4)) {
          return k;
        }
      }
    }
    return null;
  }

  private advance(k: number, a: number, phase: number): void {
    this.n += k;
    this.lastPhase = phase;
    this.lastArrival = a;
    this.points.push({ n: this.n, a });
    if (this.points.length > WINDOW) this.points.shift();
    this.refit();
  }

  private rebase(phase: number, a: number): void {
    this.lastPhase = phase;
    this.lastArrival = a;
    this.n = 0;
    this.points = [{ n: 0, a }];
  }

  /** Least squares a ≈ A₀ + n·slope over the window, then the anti-jitter
   *  anchor: the minimum residual arrival (delivery delay only adds). */
  private refit(): void {
    const pts = this.points;
    if (pts.length < 2) return;
    let sn = 0;
    let sa = 0;
    for (const p of pts) {
      sn += p.n;
      sa += p.a;
    }
    const mn = sn / pts.length;
    const ma = sa / pts.length;
    let cov = 0;
    let varN = 0;
    for (const p of pts) {
      cov += (p.n - mn) * (p.a - ma);
      varN += (p.n - mn) * (p.n - mn);
    }
    if (varN === 0) return;
    this.slope = cov / varN;
    let anchor = Infinity;
    for (const p of pts) {
      const residual = p.a - p.n * this.slope;
      if (residual < anchor) anchor = residual;
    }
    this.anchor = anchor;
  }
}
