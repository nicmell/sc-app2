// Transport packet logging middleware. Owns only the bounded OSC log view.

import { flattenPacket } from "@sc-app/server-commands";
import { MAX_LOG, OSC_REPLIES } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import type { TransportMiddleware } from "../middleware";

const state = appStore.slice(SliceName.OSC);
export const log = state.select((value) => value.log);
let nextEntryId = 0;

const skippedRx = new Set(["/scope/chunk", "/clock/tick", "/clock/status", OSC_REPLIES.STATUS]);

function append(dir: "tx" | "rx", address: string, args: string[]): void {
  state.update((value) => ({
    ...value,
    log: [...value.log, { ts: Date.now(), dir, address, args, id: nextEntryId++ }].slice(-MAX_LOG),
  }));
}

export const logging: TransportMiddleware = {
  command(command, next) {
    if (command.type === "osc") {
      for (const message of flattenPacket(command.packet)) {
        if (!message.address.startsWith("/clock/")) append("tx", message.address, message.args);
      }
    }
    next(command);
  },
  event(event, next) {
    if (event.type === "osc") {
      for (const message of flattenPacket(event.packet)) {
        if (!skippedRx.has(message.address)) append("rx", message.address, message.args);
      }
    }
    next(event);
  },
};
