import type { OscArg, ServerMessage } from "../../pkg/scserver_commands.js";
import { toOscArg } from "./helpers.js";
/** `/scope/subscribe` — Register a scope-slot stream. */
export function scopeSubscribe(params: {
  subId: number;
  scope: number;
  channels: number;
  chunkSize: number;
}): ServerMessage {
  return { address: "/scope/subscribe", args: params };
}
/** `/scope/unsubscribe` — Drop a scope stream. */
export function scopeUnsubscribe(subId: number): ServerMessage {
  return { address: "/scope/unsubscribe", args: { subId } };
}
/** `/dirt/play` — Send one SuperDirt event. */
export function dirtPlay(event: Record<string, string | number>): ServerMessage {
  return {
    address: "/dirt/play",
    args: {
      pairs: Object.entries(event).map(([key, value]): [string, OscArg] => [key, toOscArg(value)]),
    },
  };
}
