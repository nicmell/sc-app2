// Transport packet logging middleware. Owns only the bounded OSC log view.

import { ADDR_STATUS_REPLY, ADDR_TR, formatOscArg, type OscMessage } from "@sc-app/server-commands";
import { CLOCK_TRIGGER_ID } from "@/constants/osc";
import { MAX_LOG } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import type { TransportMiddleware } from "../middleware";

const state = appStore.slice(SliceName.OSC);
export const log = state.select((value) => value.log);
let nextEntryId = 0;

const skippedRx = new Set(["/scope/chunk", "/clock/sample", ADDR_STATUS_REPLY]);

/** High-rate rx to keep out of the console: the skip set, plus the global
 *  clock's /tr ticks — but ONLY ours; a plugin's own SendTrig stays logged. */
function skipRx(message: OscMessage): boolean {
  return (
    skippedRx.has(message.address) ||
    (message.address === ADDR_TR && message.args[1] === CLOCK_TRIGGER_ID)
  );
}

function append(dir: "tx" | "rx", address: string, args: string[]): void {
  state.update((value) => ({
    ...value,
    log: [...value.log, { ts: Date.now(), dir, address, args, id: nextEntryId++ }].slice(-MAX_LOG),
  }));
}

export const loggingMiddleware: TransportMiddleware = {
  command(command, next) {
    if (command.type === "osc" && !command.packet.address.startsWith("/clock/")) {
      append("tx", command.packet.address, command.packet.args.map(formatOscArg));
    }
    next(command);
  },
  event(event, next) {
    if (event.type === "osc" && !skipRx(event.packet)) {
      append("rx", event.packet.address, event.packet.args.map(formatOscArg));
    }
    next(event);
  },
};
