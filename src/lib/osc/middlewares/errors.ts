// Transport and scsynth error middleware: observes the command/event stream
// and surfaces failures as entries in the global toast stack (stores/toasts),
// namespaced under `osc:` keys so reconnects clear only its own toasts.

import { ADDR_FAIL, ADDR_LATE, formatOscArg, walkPacket } from "@sc-app/server-commands";
import { clearToasts, pushToast } from "@/stores/toasts";
import type { TransportMiddleware } from "../middleware";

const KEY_PREFIX = "osc:";

/** One coalescing toast per (address, detail) pair, shown as "address: detail".
 *  Shared with the status watchdog — every OSC-plane toast goes through here
 *  so the reconnect reset clears them all. */
export function pushOscToast(address: string, detail: string, variant: "error" | "warn"): void {
  pushToast({
    key: `${KEY_PREFIX}${address}:${detail}`,
    message: `${address}: ${detail}`,
    variant,
  });
}

export const errorsMiddleware: TransportMiddleware = {
  command(command, next) {
    // connect() has no throwing path before its synchronous join(), so this
    // preserves the former connecting-event reset timing.
    if (command.type === "join") clearToasts((toast) => toast.key?.startsWith(KEY_PREFIX) ?? false);
    next(command);
  },
  event(event, next) {
    if (event.type === "error") {
      console.error("[osc] transport error:", event.message);
      pushOscToast("websocket", event.message, "error");
    } else if (event.type === "close" && event.code && event.code !== 1000) {
      const message = `connection closed (${event.code}${event.reason ? `: ${event.reason}` : ""})`;
      console.warn(`[osc] ${message}`);
      pushOscToast("websocket", message, "warn");
    } else if (event.type === "osc") {
      walkPacket(event.packet, (message) => {
        if (message.address === ADDR_FAIL) {
          const command = formatOscArg(message.args[0] ?? "?");
          const detail = formatOscArg(message.args[1] ?? "(no message)");
          console.error(`[scsynth] ${command}: ${detail}`);
          pushOscToast(command, detail, "error");
        } else if (message.address === ADDR_LATE) {
          const seconds = Number(message.args[0]) || 0;
          const detail = `bundle ran ${seconds.toFixed(3)}s late`;
          console.warn(`[scsynth] /late: ${detail}`);
          pushOscToast(ADDR_LATE, detail, "warn");
        }
      });
    }
    next(event);
  },
};
