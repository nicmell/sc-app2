// The status watchdog is an external consumer of OscClient's public seams.
// It follows the connected signal, observes `/status.reply` transport events,
// and checks freshness on the worker's unthrottled clock so background-tab
// timer throttling cannot postpone detection of a dead scsynth connection.

import { OSC_REPLIES, CLOCK_WATCHDOG_INTERVAL_MS, STATUS_REPLY_TIMEOUT_MS } from "@/constants/osc";
import { walkPacket } from "@sc-app/server-commands";
import type { TransportMiddleware } from "./middleware";
import { oscClient } from "./OscClient";
import { push } from "./middlewares/errors";

export class StatusWatchdog {
  private lastStatusAt = 0;
  private watchdogOff: (() => void) | null = null;
  readonly middleware: TransportMiddleware = {
    event: (event, next) => {
      if (event.type === "osc") {
        walkPacket(event.packet, (message) => {
          if (message.address === OSC_REPLIES.STATUS) this.lastStatusAt = performance.now();
        });
      }
      next(event);
    },
  };

  constructor() {
    oscClient.connected.subscribe(() => {
      if (oscClient.connected.get()) this.arm();
      else this.disarm();
    });
  }

  private arm(): void {
    this.disarm();
    this.lastStatusAt = performance.now();
    this.watchdogOff = oscClient.subscribeClock(CLOCK_WATCHDOG_INTERVAL_MS, () => {
      if (
        !oscClient.connected.get() ||
        performance.now() - this.lastStatusAt <= STATUS_REPLY_TIMEOUT_MS
      ) {
        return;
      }
      const message = `no ${OSC_REPLIES.STATUS} for ${STATUS_REPLY_TIMEOUT_MS / 1000}s — connection closed`;
      console.error(`[osc] ${message}`);
      push(OSC_REPLIES.STATUS, message, "error");
      oscClient.close();
    }).off;
  }

  private disarm(): void {
    this.watchdogOff?.();
    this.watchdogOff = null;
  }
}

/** Import-time singleton: main.tsx is the documented activation point. */
export const statusWatchdog = new StatusWatchdog();
