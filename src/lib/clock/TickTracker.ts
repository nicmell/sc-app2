// The one-way audio-clock tracker (AUDIO-CLOCK.md): turns the
// `__global_clock__` synth's `/clock/tick` payload into a measurable
// time source. Each tick carries its ABSOLUTE index (PulseCount — the
// payload is self-locating, so UDP loss needs no healing and the
// timeline's origin is shared with every other consumer, sclang's
// anchor included); the tracker regresses arrival times against the
// index grid and exposes
//
//   - `skewPpm`  — how fast the LOCAL clock runs against the audio clock,
//   - `audioNow` — the engine's current time (seconds since resync),
//     anchored on the minimum-residual arrival (NTP's min-filter
//     philosophy, one-way: delivery delay only ever ADDS, so the least
//     delayed arrival is the least biased anchor),
//   - `audioNowTicksAbsolute` — "now" projected onto the ABSOLUTE tick
//     axis (the /dirt/play/at target domain).
//
// A non-increasing index means the engine or synth restarted (PulseCount
// reset — the f32 rollover past TICK_COUNT_EXACT degrades the same way):
// the tracker resyncs and re-locks from scratch. The phase payload is
// not consumed here (it mirrors bus 1000 and stays available for future
// refinement).
//
// Everything runs in ONE context (the main thread) over
// performance.now(), so the timeOrigin rule is untouched. Pure math +
// DI'd clock — composed by ClockSync, driven synthetically in tests.

interface TickTrackerOptions {
  /** The tick rate (`CLOCK_TICK_FREQ_HZ`). */
  freqHz: number;
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

export class TickTracker {
  private readonly freqHz: number;
  private readonly monotonicNow: () => number;

  /** The absolute index the current sync is rebased on. */
  private base: number | null = null;
  private lastIndex = 0;
  private n = 0;
  private points: Point[] = [];
  private slope = 0;
  private anchor = 0;

  constructor({ freqHz, monotonicNow = () => performance.now() }: TickTrackerOptions) {
    this.freqHz = freqHz;
    this.monotonicNow = monotonicNow;
  }

  /** Fold one tick's absolute index in. */
  onTick(index: number): void {
    if (!Number.isFinite(index)) return;
    const a = this.monotonicNow();

    // A non-increasing index = PulseCount reset (engine/synth restart,
    // or the f32 rollover) — resync. Forward gaps are ordinary UDP loss:
    // the index is self-locating, nothing to heal.
    if (this.base === null || index <= this.lastIndex) {
      this.base = index;
      this.lastIndex = index;
      this.n = 0;
      this.points = [{ n: 0, a }];
      return;
    }

    this.lastIndex = index;
    this.n = index - this.base;
    this.points.push({ n: this.n, a });
    if (this.points.length > WINDOW) this.points.shift();
    this.refit();
  }

  /** Forget the sync (socket closed); the next tick re-bases. */
  reset(): void {
    this.base = null;
    this.n = 0;
    this.points = [];
  }

  get locked(): boolean {
    return this.points.length >= LOCK_MIN;
  }

  /** Tick index since the last (re)sync — null until locked. */
  get tickIndex(): number | null {
    return this.locked ? this.n : null;
  }

  /** How fast the local clock runs against the audio clock, in parts per
   *  million — null until locked. */
  get skewPpm(): number | null {
    if (!this.locked) return null;
    return (this.slope / (1000 / this.freqHz) - 1) * 1e6;
  }

  /** The audio engine's current time in SECONDS since the last (re)sync,
   *  estimated one-way — null until locked. NOT guaranteed monotonic
   *  across refits (why Strudel's getTime does not consume this). */
  audioNow(): number | null {
    if (!this.locked) return null;
    const ticksNow = (this.monotonicNow() - this.anchor) / this.slope;
    return ticksNow / this.freqHz;
  }

  /** "Now" on the ABSOLUTE tick axis (the shared timeline every consumer
   *  of /clock/tick counts on) — null until locked. The /dirt/play/at
   *  target domain. */
  audioNowTicksAbsolute(): number | null {
    if (!this.locked || this.base === null) return null;
    return this.base + (this.monotonicNow() - this.anchor) / this.slope;
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
