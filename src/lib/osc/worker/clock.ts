import {
  CLOCK_PONG_ADDRESS,
  CLOCK_SUBSCRIBE_ADDRESS,
  CLOCK_UNSUBSCRIBE_ADDRESS,
  ClockPong,
  clockPing,
  clockStatus,
  clockTick,
  type OscMessage,
} from "@sc-app/server-commands";
import {
  CLOCK_OFFSET_SLEW_FACTOR,
  CLOCK_OFFSET_STEP_THRESHOLD_MS,
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
  timer: ReturnType<typeof setTimeout>;
  phase0: number;
  intervalMs: number;
  n: number;
}

interface ClockOptions {
  post: (message: OscMessage) => void;
  sendPing: (message: OscMessage) => void;
  monotonicNow?: () => number;
}

export class WorkerClock {
  private readonly post: ClockOptions["post"];
  private readonly sendPing: ClockOptions["sendPing"];
  private readonly monotonicNow: () => number;
  private samples: ClockSample[] = [];
  private offset = 0;
  private sequence = 0;
  private pending = new Map<number, number>();
  private burstTimer: ReturnType<typeof setInterval> | null = null;
  private cadenceTimer: ReturnType<typeof setInterval> | null = null;
  private ticks = new Map<number, TickStream>();

  constructor({ post, sendPing, monotonicNow = () => performance.now() }: ClockOptions) {
    this.post = post;
    this.sendPing = sendPing;
    this.monotonicNow = monotonicNow;
  }

  onOpen(): void {
    this.stopPinging();
    this.samples = [];
    this.pending.clear();
    this.offset = 0;
    this.post(clockStatus(0, 0));
    this.ping();
    let sent = 1;
    if (sent < CLOCK_PING_BURST_COUNT) {
      this.burstTimer = setInterval(() => {
        this.ping();
        if (++sent >= CLOCK_PING_BURST_COUNT && this.burstTimer !== null) {
          clearInterval(this.burstTimer);
          this.burstTimer = null;
        }
      }, CLOCK_PING_BURST_INTERVAL_MS);
    }
    this.cadenceTimer = setInterval(() => this.ping(), CLOCK_PING_INTERVAL_MS);
  }

  onClose(): void {
    this.stopPinging();
    this.samples = [];
    this.pending.clear();
    this.offset = 0;
    this.post(clockStatus(0, 0));
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

    // Median-filter the RTT window, then take its minimum-delay sample: NTP's
    // clock-filter rule avoids queueing delay without letting the slow half
    // of a burst influence the exported estimate.
    const byRtt = [...this.samples].sort((a, b) => a.rtt - b.rtt);
    const medianRtt = byRtt[Math.floor(byRtt.length / 2)].rtt;
    const best = byRtt.find((sample) => sample.rtt <= medianRtt) ?? byRtt[0];
    const target = best.offset;
    const delta = target - this.offset;
    this.offset =
      this.samples.length === 1 || Math.abs(delta) > CLOCK_OFFSET_STEP_THRESHOLD_MS
        ? target
        : this.offset + delta * CLOCK_OFFSET_SLEW_FACTOR;
    this.post(clockStatus(this.offset, best.rtt));
  }

  handleCommand(message: OscMessage): void {
    if (message.address === CLOCK_SUBSCRIBE_ADDRESS) {
      const id = Number(message.args[0]);
      const intervalMs = Number(message.args[1]);
      if (!Number.isInteger(id) || !Number.isFinite(intervalMs) || intervalMs <= 0) return;
      this.unsubscribe(id);
      const stream: TickStream = {
        timer: 0 as unknown as ReturnType<typeof setTimeout>,
        phase0: this.monotonicNow(),
        intervalMs,
        n: 1,
      };
      this.ticks.set(id, stream);
      this.schedule(id, stream);
    } else if (message.address === CLOCK_UNSUBSCRIBE_ADDRESS) {
      this.unsubscribe(Number(message.args[0]));
    }
  }

  private ping(): void {
    const seq = this.sequence++;
    this.pending.set(seq, this.monotonicNow());
    this.sendPing(clockPing(seq));
  }

  private schedule(id: number, stream: TickStream): void {
    const next = stream.phase0 + stream.n * stream.intervalMs;
    stream.timer = setTimeout(
      () => {
        if (this.ticks.get(id) !== stream) return;
        this.post(clockTick(id, stream.n));
        stream.n += 1;
        this.schedule(id, stream);
      },
      Math.max(0, next - this.monotonicNow()),
    );
  }

  private unsubscribe(id: number): void {
    const stream = this.ticks.get(id);
    if (!stream) return;
    clearTimeout(stream.timer);
    this.ticks.delete(id);
  }

  private stopPinging(): void {
    if (this.burstTimer !== null) clearInterval(this.burstTimer);
    if (this.cadenceTimer !== null) clearInterval(this.cadenceTimer);
    this.burstTimer = null;
    this.cadenceTimer = null;
  }
}
