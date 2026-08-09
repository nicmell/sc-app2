// OSC telemetry is a passive observer of OscClient's public lifecycle and
// packet taps. It owns every OSC store field except the client's transport
// `connected` signal: the bounded console history, banners, scsynth load, and
// bridge clock diagnostics. Importing the singleton activates those observers.

import {
  flattenPacket,
  formatOscArg,
  SCOPE_CHUNK_ADDRESS,
  CLOCK_STATUS_ADDRESS,
  CLOCK_TICK_ADDRESS,
  type OscArg,
  type OscMessage,
  type OscPacket,
} from "@sc-app/server-commands";
import { MAX_ERRORS, MAX_LOG, OSC_REPLIES } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import type { ScsynthStatus } from "@/types/stores";
import { oscClient } from "./OscClient";

/** Parse a `/status.reply`'s args. Layout (scsynth):
 *  `[1, ugens, synths, groups, defs, avgCpu, peakCpu, srNominal, srActual]`. */
function parseStatus(args: ReadonlyArray<OscArg>): ScsynthStatus {
  return {
    avgCpu: Number(args[5]) || 0,
    peakCpu: Number(args[6]) || 0,
    sampleRate: Number(args[8]) || 0,
    numUgens: Number(args[1]) || 0,
    numSynths: Number(args[2]) || 0,
    numGroups: Number(args[3]) || 0,
  };
}

export class OscTelemetry {
  private readonly state = appStore.slice(SliceName.OSC);
  readonly log = this.state.select((s) => s.log);
  readonly errors = this.state.select((s) => s.errors);
  readonly scsynthStatus = this.state.select((s) => s.scsynthStatus);
  readonly clock = this.state.select((s) => s.clock);
  /** Stable React keys shared by log entries and banners. */
  private nextEntryId = 0;

  constructor() {
    oscClient.on("connecting", () => {
      this.state.update((s) => ({ ...s, scsynthStatus: null, errors: [] }));
    });
    oscClient.on("error", (err) => {
      console.error("[osc] transport error:", err);
      this.push("websocket", err.message, "error");
    });
    oscClient.on("close", (info) => {
      if (!info?.code || info.code === 1000) return;
      const message = `connection closed (${info.code}${info.reason ? `: ${info.reason}` : ""})`;
      console.warn(`[osc] ${message}`);
      this.push("websocket", message, "warn");
    });
    oscClient.on("message", (msg) => this.handleMessage(msg));
    oscClient.on("send", (packet) => this.handleSend(packet));
  }

  /** Add a banner, coalescing an identical address/message occurrence. */
  push(address: string, message: string, variant: "error" | "warn"): void {
    this.state.update((s) => {
      const existing = s.errors.find((e) => e.address === address && e.message === message);
      const errors = existing
        ? s.errors.map((e) => (e === existing ? { ...e, count: e.count + 1, ts: Date.now() } : e))
        : [
            ...s.errors,
            { id: this.nextEntryId++, address, message, variant, count: 1, ts: Date.now() },
          ].slice(-MAX_ERRORS);
      return { ...s, errors };
    });
  }

  /** Dismiss one banner by id (the toast's × / auto-dismiss timer). */
  dismissError(id: number): void {
    this.state.update((s) => ({ ...s, errors: s.errors.filter((e) => e.id !== id) }));
  }

  /** Drop every banner. */
  clearErrors(): void {
    this.state.update((s) => ({ ...s, errors: [] }));
  }

  private handleSend(packet: OscPacket): void {
    for (const { address, args } of flattenPacket(packet)) this.append("tx", address, args);
  }

  private handleMessage(msg: OscMessage): void {
    if (msg.address === SCOPE_CHUNK_ADDRESS || msg.address === CLOCK_TICK_ADDRESS) return;
    if (msg.address === CLOCK_STATUS_ADDRESS) {
      const offset = Number(msg.args[0]);
      const rtt = Number(msg.args[1]);
      if (Number.isFinite(offset) && Number.isFinite(rtt)) {
        this.state.update((s) => ({ ...s, clock: { offset, rtt } }));
      }
      return;
    }
    if (msg.address === OSC_REPLIES.STATUS) {
      this.state.update((s) => ({ ...s, scsynthStatus: parseStatus(msg.args) }));
      return;
    }
    if (msg.address === OSC_REPLIES.FAIL) {
      const command = formatOscArg(msg.args[0] ?? "?");
      const message = formatOscArg(msg.args[1] ?? "(no message)");
      console.error(`[scsynth] ${command}: ${message}`);
      this.push(command, message, "error");
    } else if (msg.address === OSC_REPLIES.LATE) {
      const seconds = Number(msg.args[0]) || 0;
      const message = `bundle ran ${seconds.toFixed(3)}s late`;
      console.warn(`[scsynth] /late: ${message}`);
      this.push("/late", message, "warn");
    }
    this.append("rx", msg.address, msg.args.map(formatOscArg));
  }

  private append(dir: "tx" | "rx", address: string, args: string[]): void {
    this.state.update((s) => ({
      ...s,
      log: [...s.log, { ts: Date.now(), dir, address, args, id: this.nextEntryId++ }].slice(
        -MAX_LOG,
      ),
    }));
  }
}

/** The one telemetry observer for the frontend; construction wires all taps. */
export const oscTelemetry = new OscTelemetry();
