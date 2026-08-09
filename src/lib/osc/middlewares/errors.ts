// Transport and scsynth error middleware. Owns only coalesced error banners.

import { ADDR_FAIL, ADDR_LATE, formatOscArg, walkPacket } from "@sc-app/server-commands";
import { MAX_ERRORS } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import type { TransportMiddleware } from "../middleware";

const state = appStore.slice(SliceName.OSC);
export const errors = state.select((value) => value.errors);
let nextBannerId = 0;

export function pushError(address: string, message: string, variant: "error" | "warn"): void {
  state.update((value) => {
    const existing = value.errors.find(
      (error) => error.address === address && error.message === message,
    );
    const next = existing
      ? value.errors.map((error) =>
          error === existing ? { ...error, count: error.count + 1, ts: Date.now() } : error,
        )
      : [
          ...value.errors,
          { id: nextBannerId++, address, message, variant, count: 1, ts: Date.now() },
        ].slice(-MAX_ERRORS);
    return { ...value, errors: next };
  });
}

export function dismissError(id: number): void {
  state.update((value) => ({ ...value, errors: value.errors.filter((error) => error.id !== id) }));
}

export function clearErrors(): void {
  state.update((value) => ({ ...value, errors: [] }));
}

export const errorsMiddleware: TransportMiddleware = {
  command(command, next) {
    // connect() has no throwing path before its synchronous open(), so this
    // preserves the former connecting-event reset timing.
    if (command.type === "open") clearErrors();
    next(command);
  },
  event(event, next) {
    if (event.type === "error") {
      console.error("[osc] transport error:", event.message);
      pushError("websocket", event.message, "error");
    } else if (event.type === "close" && event.code && event.code !== 1000) {
      const message = `connection closed (${event.code}${event.reason ? `: ${event.reason}` : ""})`;
      console.warn(`[osc] ${message}`);
      pushError("websocket", message, "warn");
    } else if (event.type === "osc") {
      walkPacket(event.packet, (message) => {
        if (message.address === ADDR_FAIL) {
          const command = formatOscArg(message.args[0] ?? "?");
          const detail = formatOscArg(message.args[1] ?? "(no message)");
          console.error(`[scsynth] ${command}: ${detail}`);
          pushError(command, detail, "error");
        } else if (message.address === ADDR_LATE) {
          const seconds = Number(message.args[0]) || 0;
          const detail = `bundle ran ${seconds.toFixed(3)}s late`;
          console.warn(`[scsynth] /late: ${detail}`);
          pushError(ADDR_LATE, detail, "warn");
        }
      });
    }
    next(event);
  },
};
