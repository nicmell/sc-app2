import type { ServerMessage } from "../../pkg/scserver_commands.js";
import { toOscArg } from "./helpers.js";
/** `/clearSched` — Clear all scheduled bundles. */
export function clearSched(): ServerMessage {
  return { address: "/clearSched" };
}
/** `/cmd` — Execute a plugin command. */
export function cmd(
  command: string,
  args: readonly (number | string | Uint8Array)[],
): ServerMessage {
  return { address: "/cmd", args: { cmd: command, anyArguments: args.map(toOscArg) } };
}
/** `/dumpOSC` — Set OSC message dumping mode. */
export function dumpOSC(code: number): ServerMessage {
  return { address: "/dumpOSC", args: { code } };
}
/** `/error` — Set error posting mode. */
export function error(mode: number): ServerMessage {
  return { address: "/error", args: { mode } };
}
/** `/notify` — Register or unregister for notifications. */
export function notify(enable: number, clientId?: number): ServerMessage {
  return { address: "/notify", args: { enable, clientId } };
}
/** `/quit` — Quit the server. */
export function quit(): ServerMessage {
  return { address: "/quit" };
}
/** `/rtMemoryStatus` — Report real-time memory status. */
export function rtMemoryStatus(): ServerMessage {
  return { address: "/rtMemoryStatus" };
}
/** `/status` — Request server status. */
export function status(): ServerMessage {
  return { address: "/status" };
}
/** `/sync` — Request synchronization after asynchronous commands. */
export function sync(id: number): ServerMessage {
  return { address: "/sync", args: { aUniqueNumber: id } };
}
/** `/version` — Request server version. */
export function version(): ServerMessage {
  return { address: "/version" };
}
