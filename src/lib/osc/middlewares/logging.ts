// Transport packet logging middleware. Owns only the bounded OSC log view.

import { ADDR_STATUS_REPLY, formatOscArg, walkPacket } from "@sc-app/server-commands";
import { MAX_LOG } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import type { TransportMiddleware } from "../middleware";

const state = appStore.slice(SliceName.OSC);
export const log = state.select((value) => value.log);
let nextEntryId = 0;

const skippedRx = new Set(["/scope/chunk", "/clock/tick", "/clock/status", ADDR_STATUS_REPLY]);

function append(dir: "tx" | "rx", address: string, args: string[]): void {
  state.update((value) => ({
    ...value,
    log: [...value.log, { ts: Date.now(), dir, address, args, id: nextEntryId++ }].slice(-MAX_LOG),
  }));
}

export const loggingMiddleware: TransportMiddleware = {
  command(command, next) {
    if (command.type === "osc") {
      walkPacket(command.packet, (message) => {
        if (!message.address.startsWith("/clock/")) {
          append("tx", message.address, message.args.map(formatOscArg));
        }
      });
    }
    next(command);
  },
  event(event, next) {
    if (event.type === "osc") {
      walkPacket(event.packet, (message) => {
        if (!skippedRx.has(message.address)) {
          append("rx", message.address, message.args.map(formatOscArg));
        }
      });
    }
    next(event);
  },
};
