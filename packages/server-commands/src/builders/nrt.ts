import type { ServerMessage } from "../../pkg/scserver_commands.js";
/** `/nrt_end` — End non-real-time synthesis. */
export function nrtEnd(): ServerMessage {
  return { address: "/nrt_end" };
}
