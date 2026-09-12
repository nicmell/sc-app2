// The bridge clock's WORKER half (docs/clock.md): the ping loop and the
// heartbeat watchdog, both on worker timers (unthrottled in background) and
// both alive exactly while the socket is (start/stop).
//
// - Ping/pong measurement: t0/t1 captured beside the socket in the worker's
//   monotonic domain (measured on the main thread, postMessage and
//   event-loop jitter would land straight in rtt/2). Each accepted pong
//   posts ONE raw `/clock/sample` up — which is ALSO the main thread's
//   metronome: ClockSync (src/lib/clock) filters the samples AND drives the
//   clock callbacks off their arrival.
// - Heartbeat watchdog: `markAlive()` stamps every non-pong inbound message passing
//   through the endpoint; a worker-timer poll fires `onDead` once when the
//   heartbeats go stale — the detector must NOT depend on the (possibly
//   silently dead) connection it watches, which is why it lives here.

import { ClockPong, clockPing, clockSample, type OscMessage } from "@sc-app/server-commands";
import {
  CLOCK_PING_INTERVAL_MS,
  CLOCK_WATCHDOG_INTERVAL_MS,
  STATUS_REPLY_TIMEOUT_MS,
} from "@/constants/osc";

interface ClockOptions {
  post: (message: OscMessage) => void;
  sendPing: (message: OscMessage) => void;
  /** Fired ONCE when scsynth's heartbeats go stale (the clock stops itself
   *  first) — the endpoint surfaces it as a transport error. */
  onDead: () => void;
  monotonicNow?: () => number;
}

export class WorkerClock {
  private readonly post: ClockOptions["post"];
  private readonly sendPing: ClockOptions["sendPing"];
  private readonly onDead: ClockOptions["onDead"];
  private readonly monotonicNow: () => number;

  private sequence = 0;
  /** seq → send time. Lost pongs linger until the next start/stop reset —
   *  bounded by the ping cadence, accepted. */
  private readonly pending = new Map<number, number>();
  private pingTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private lastStatusAt = 0;

  constructor({ post, sendPing, onDead, monotonicNow = () => performance.now() }: ClockOptions) {
    this.post = post;
    this.sendPing = sendPing;
    this.onDead = onDead;
    this.monotonicNow = monotonicNow;
  }

  /** Start (or restart) the ping loop and the watchdog on a fresh socket. */
  start(): void {
    this.stop();
    this.lastStatusAt = this.monotonicNow(); // grace: a fresh session earns a full timeout
    this.pingLoop();
    this.watchdogTimer = setInterval(() => {
      if (this.monotonicNow() - this.lastStatusAt > STATUS_REPLY_TIMEOUT_MS) {
        this.stop(); // fire once — no timer left to re-enter
        this.onDead();
      }
    }, CLOCK_WATCHDOG_INTERVAL_MS);
  }

  /** Stop pinging and watching; posts nothing — the main thread resets its
   *  estimate on its own close event. */
  stop(): void {
    if (this.pingTimer !== null) clearTimeout(this.pingTimer);
    this.pingTimer = null;
    if (this.watchdogTimer !== null) clearInterval(this.watchdogTimer);
    this.watchdogTimer = null;
    this.pending.clear();
  }

  /** Stamp session liveness (any non-pong inbound message, per the endpoint). */
  markAlive(): void {
    this.lastStatusAt = this.monotonicNow();
  }

  /** One raw sample per accepted pong. Offset is expressed over `Date.now()`
   *  (`d1` = arrival wall time) so it crosses the postMessage boundary —
   *  `performance.timeOrigin` differs per context and never may. */
  onPong(message: OscMessage, d1: number): void {
    const seq = ClockPong.seq(message);
    const t0 = this.pending.get(seq);
    if (t0 === undefined) return;
    this.pending.delete(seq);
    const srv = ClockPong.serverTime(message);
    const rtt = this.monotonicNow() - t0;
    if (!Number.isFinite(rtt) || rtt < 0 || !Number.isFinite(srv)) return;
    this.post(clockSample(srv + rtt / 2 - d1, rtt));
  }

  /** One chained ping loop — the wall-time anchor cadence (first ping fires
   *  immediately, so the first lock is still ≈ the first pong). */
  private pingLoop(): void {
    const seq = this.sequence++;
    this.pending.set(seq, this.monotonicNow());
    this.sendPing(clockPing(seq));
    this.pingTimer = setTimeout(() => this.pingLoop(), CLOCK_PING_INTERVAL_MS);
  }
}
