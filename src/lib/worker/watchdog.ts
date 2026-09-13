// The session heartbeat watchdog, on worker timers (unthrottled in
// background, independent of the possibly-dead connection it watches).
// The heartbeat is the GLOBAL CLOCK's /clock/tick (AUDIO-CLOCK.md): the
// endpoint stamps `markAlive()` on every tick it sees; a worker-timer poll
// fires `onDead` once when the ticks go stale. One signal, one meaning —
// the DSP graph computing IS the session being alive; a stack that never
// loads the clock synth is declared dead within the timeout instead of
// limping along with a silent metronome.

import { CLOCK_WATCHDOG_INTERVAL_MS, WATCHDOG_TIMEOUT_MS } from "@/constants/osc";

interface WatchdogOptions {
  /** Fired ONCE when the ticks go stale (the watchdog stops itself
   *  first) — the endpoint surfaces it as a transport error. */
  onDead: () => void;
  monotonicNow?: () => number;
}

export class Watchdog {
  private readonly onDead: WatchdogOptions["onDead"];
  private readonly monotonicNow: () => number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastAliveAt = 0;

  constructor({ onDead, monotonicNow = () => performance.now() }: WatchdogOptions) {
    this.onDead = onDead;
    this.monotonicNow = monotonicNow;
  }

  /** Arm on a fresh socket — a new session earns a full timeout of grace. */
  start(): void {
    this.stop();
    this.lastAliveAt = this.monotonicNow();
    this.timer = setInterval(() => {
      if (this.monotonicNow() - this.lastAliveAt > WATCHDOG_TIMEOUT_MS) {
        this.stop(); // fire once — no timer left to re-enter
        this.onDead();
      }
    }, CLOCK_WATCHDOG_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  /** Stamp one live heartbeat (the global clock's /clock/tick, per the endpoint). */
  markAlive(): void {
    this.lastAliveAt = this.monotonicNow();
  }
}
