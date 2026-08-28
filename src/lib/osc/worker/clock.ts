// The in-worker bridge-clock service (docs/clock.md): the offset estimator
// (chained ping loop → 8-sample min-RTT window, NTP's clock-filter rule,
// published through `onStatus`) and the tick scheduler behind
// `subscribe(intervalMs, onTick)`. Ticks fire at `phase0 + n × intervalMs` —
// each timer re-aims at the absolute target, so setTimeout jitter never
// accumulates. In the worker so both survive main-thread jank; a socket
// close resets the estimator but tick streams keep running (subscriptions
// survive reconnect). Only ping/pong are OSC — they genuinely cross the
// wire (the pinned core/clock.rs contract); everything else is a plain
// callback API, consumed by the shared endpoint.
import { clockPing, ClockPong, CLOCK_PONG_ADDRESS, type OscMessage } from "@sc-app/server-commands";
import {
  CLOCK_PING_BURST_COUNT,
  CLOCK_PING_BURST_INTERVAL_MS,
  CLOCK_PING_INTERVAL_MS,
  CLOCK_SAMPLE_WINDOW,
} from "@/constants/osc";

interface ClockSample {
  offset: number;
  rtt: number;
}

interface TickStream {
  timer?: ReturnType<typeof setTimeout>;
  phase0: number;
  intervalMs: number;
  n: number;
  onTick: (n: number) => void;
}

interface ClockOptions {
  /** The estimator's published offset/rtt (zeroed on open/close resets). */
  onStatus: (offset: number, rtt: number) => void;
  sendPing: (message: OscMessage) => void;
  monotonicNow?: () => number;
}

export class WorkerClock {
  private readonly onStatus: ClockOptions["onStatus"];
  private readonly sendPing: ClockOptions["sendPing"];
  private readonly monotonicNow: () => number;
  private samples: ClockSample[] = [];
  private sequence = 0;
  /** seq → send time. Lost pongs linger until the next open/close reset —
   *  bounded by the ping cadence, accepted. */
  private pending = new Map<number, number>();
  private pingTimer: ReturnType<typeof setTimeout> | null = null;
  private pingsSent = 0;
  private readonly ticks = new Set<TickStream>();

  constructor({ onStatus, sendPing, monotonicNow = () => performance.now() }: ClockOptions) {
    this.onStatus = onStatus;
    this.sendPing = sendPing;
    this.monotonicNow = monotonicNow;
  }

  onOpen(): void {
    this.stopPinging();
    this.samples = [];
    this.pending.clear();
    this.onStatus(0, 0);
    this.pingsSent = 0;
    this.pingLoop();
  }

  onClose(): void {
    this.stopPinging();
    this.samples = [];
    this.pending.clear();
    this.onStatus(0, 0);
  }

  onPong(message: OscMessage, d1: number): void {
    if (message.address !== CLOCK_PONG_ADDRESS) return;
    const seq = ClockPong.seq(message);
    const t0 = this.pending.get(seq);
    if (t0 === undefined) return;
    this.pending.delete(seq);
    const srv = ClockPong.serverTime(message);
    const rtt = this.monotonicNow() - t0;
    if (!Number.isFinite(rtt) || rtt < 0 || !Number.isFinite(srv)) return;
    this.samples.push({ rtt, offset: srv + rtt / 2 - d1 });
    if (this.samples.length > CLOCK_SAMPLE_WINDOW) this.samples.shift();

    // NTP's clock-filter rule: trust the minimum-delay sample in the window —
    // queueing delay only ever ADDS to rtt, so the fastest exchange carries
    // the least-biased offset. Consumers convert clock domains at stamp time,
    // so a small estimate change only shifts not-yet-stamped events; no
    // smoothing needed.
    const best = this.samples.reduce((a, b) => (b.rtt < a.rtt ? b : a));
    this.onStatus(best.offset, best.rtt);
  }

  /** Start an absolute-phase tick stream (n=1 fires one full interval after
   *  subscribe; tick 0 = phase0, the subscribe instant). Returns stop. */
  subscribe(intervalMs: number, onTick: (n: number) => void): () => void {
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) return () => {};
    const stream: TickStream = { phase0: this.monotonicNow(), intervalMs, n: 1, onTick };
    this.ticks.add(stream);
    this.schedule(stream);
    return () => {
      clearTimeout(stream.timer);
      this.ticks.delete(stream);
    };
  }

  /** One chained ping loop: the first CLOCK_PING_BURST_COUNT pings fire at
   *  the tight burst spacing (fast first lock), then the steady cadence. */
  private pingLoop(): void {
    const seq = this.sequence++;
    this.pending.set(seq, this.monotonicNow());
    this.sendPing(clockPing(seq));
    this.pingsSent += 1;
    const delay =
      this.pingsSent < CLOCK_PING_BURST_COUNT
        ? CLOCK_PING_BURST_INTERVAL_MS
        : CLOCK_PING_INTERVAL_MS;
    this.pingTimer = setTimeout(() => this.pingLoop(), delay);
  }

  private schedule(stream: TickStream): void {
    const next = stream.phase0 + stream.n * stream.intervalMs;
    stream.timer = setTimeout(
      () => {
        if (!this.ticks.has(stream)) return;
        stream.onTick(stream.n);
        stream.n += 1;
        this.schedule(stream);
      },
      Math.max(0, next - this.monotonicNow()),
    );
  }

  private stopPinging(): void {
    if (this.pingTimer !== null) clearTimeout(this.pingTimer);
    this.pingTimer = null;
  }
}
