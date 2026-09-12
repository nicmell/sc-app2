// SCSynth load status middleware. Owns the scsynthStatus view; the `clock`
// view's field is written by OscClient's ClockSync (lib/clock), not here.

import { ADDR_STATUS_REPLY, StatusReply, type OscMessage } from "@sc-app/server-commands";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import type { ScsynthStatus } from "@/types/stores";
import type { TransportMiddleware } from "../middleware";

const state = appStore.slice(SliceName.OSC);
export const scsynthStatus = state.select((value) => value.scsynthStatus);
export const clock = state.select((value) => value.clock);

function parseStatus(message: OscMessage): ScsynthStatus {
  return {
    avgCpu: Number(StatusReply.avgCpu(message)) || 0,
    peakCpu: Number(StatusReply.peakCpu(message)) || 0,
    sampleRate: Number(StatusReply.actualSampleRate(message)) || 0,
    numUgens: Number(StatusReply.numUGens(message)) || 0,
    numSynths: Number(StatusReply.numSynths(message)) || 0,
    numGroups: Number(StatusReply.numGroups(message)) || 0,
  };
}

export const statusMiddleware: TransportMiddleware = {
  command(command, next) {
    if (command.type === "open") state.update((value) => ({ ...value, scsynthStatus: null }));
    next(command);
  },
  event(event, next) {
    if (event.type === "osc" && event.packet.address === ADDR_STATUS_REPLY) {
      state.update((value) => ({ ...value, scsynthStatus: parseStatus(event.packet) }));
    }
    next(event);
  },
};
