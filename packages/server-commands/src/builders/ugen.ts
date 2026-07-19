import type { ServerMessage } from "../../pkg/scserver_commands.js";
import { toOscArg } from "./helpers.js";
/** `/u_cmd` — Send a command to a unit generator. */
export function uCmd(
  nodeId: number,
  unitGeneratorIndex: number,
  cmd: string,
  anyArguments: readonly (number | string | Uint8Array)[],
): ServerMessage {
  return {
    address: "/u_cmd",
    args: { nodeId, unitGeneratorIndex, cmd, anyArguments: anyArguments.map(toOscArg) },
  };
}
