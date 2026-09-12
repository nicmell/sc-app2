// A monotonic, rate-disciplined timebase (AUDIO-CLOCK.md §6 step 4, the
// slew half): the clock Strudel's `getTime` can trust. It NEVER steps —
// the output always advances — and its RATE follows a target (the inverse
// of the measured local↔audio skew) with a bounded slope, so lock,
// unlock and estimate changes are all continuous. Rate-only discipline by
// design: Cyclist only consumes deltas, absolute offset is irrelevant
// (aligning absolute phase across clients is a future shared-transport
// protocol, not a clock property).

interface SlewedClockOptions {
  /** Milliseconds, monotonic (performance.now). DI'd for tests. */
  monotonicNow?: () => number;
}

/** The discipline never bends the clock more than this from real time —
 *  crystal skews are ~100 ppm; anything larger is a measurement error. */
const MAX_RATE_ADJ = 1000e-6;
/** Maximum rate CHANGE per real second (50 ppm/s): a full ±400 ppm swing
 *  absorbs in ~8 s — far below audibility, far inside the 200 ms
 *  scheduling lookahead. */
const MAX_RATE_SLEW_PER_S = 50e-6;

export class SlewedClock {
  private readonly monotonicNow: () => number;
  private lastMonoS: number;
  private out: number;
  private rate = 1;
  private target = 1;

  constructor({ monotonicNow = () => performance.now() }: SlewedClockOptions = {}) {
    this.monotonicNow = monotonicNow;
    this.lastMonoS = this.monotonicNow() / 1000;
    this.out = this.lastMonoS; // starts ≈ the local timebase, then diverges by rate
  }

  /** Aim the rate at `target` (clamped to ±MAX_RATE_ADJ around 1). The
   *  actual rate slews there over real time — it never jumps. */
  setTargetRate(target: number): void {
    this.target = Math.min(1 + MAX_RATE_ADJ, Math.max(1 - MAX_RATE_ADJ, target));
  }

  /** Monotonic seconds. Advances the output over the elapsed real time
   *  with the exact piecewise integral of the slewing rate (ramp toward
   *  the target at the bounded slope, then flat) — sparse reads stay
   *  monotone and slope-correct. */
  time(): number {
    const monoS = this.monotonicNow() / 1000;
    const dt = monoS - this.lastMonoS;
    if (dt <= 0) return this.out;

    const diff = this.target - this.rate;
    const rampTime = Math.abs(diff) / MAX_RATE_SLEW_PER_S;
    if (dt >= rampTime) {
      // Ramp to the target, then run flat on it.
      this.out += (rampTime * (this.rate + this.target)) / 2 + (dt - rampTime) * this.target;
      this.rate = this.target;
    } else {
      const newRate = this.rate + Math.sign(diff) * MAX_RATE_SLEW_PER_S * dt;
      this.out += (dt * (this.rate + newRate)) / 2;
      this.rate = newRate;
    }
    this.lastMonoS = monoS;
    return this.out;
  }
}
