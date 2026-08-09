// SCSynth load and bridge-clock status middleware. Owns the two status views.

import {
  ClockStatus,
  CLOCK_STATUS_ADDRESS,
  walkPacket,
  type OscArg,
} from "@sc-app/server-commands";
import { OSC_REPLIES } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import type { ScsynthStatus } from "@/types/stores";
import type { TransportMiddleware } from "../middleware";

const state = appStore.slice(SliceName.OSC);
export const scsynthStatus = state.select((value) => value.scsynthStatus);
export const clock = state.select((value) => value.clock);

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

export const status: TransportMiddleware = {
  command(command, next) {
    if (command.type === "open") state.update((value) => ({ ...value, scsynthStatus: null }));
    next(command);
  },
  event(event, next) {
    if (event.type === "osc") {
      walkPacket(event.packet, (message) => {
        if (message.address === OSC_REPLIES.STATUS) {
          state.update((value) => ({ ...value, scsynthStatus: parseStatus(message.args) }));
        } else if (message.address === CLOCK_STATUS_ADDRESS) {
          const offset = ClockStatus.offset(message);
          const rtt = ClockStatus.rtt(message);
          if (Number.isFinite(offset) && Number.isFinite(rtt)) {
            state.update((value) => ({ ...value, clock: { offset, rtt } }));
          }
        }
      });
    }
    next(event);
  },
};
