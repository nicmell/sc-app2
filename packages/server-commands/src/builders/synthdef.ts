import type { ServerMessage } from "../../pkg/scserver_commands.js";
/** `/d_free` — Remove SynthDef definitions by name. */
export function dFree(...names: string[]): ServerMessage {
  return { address: "/d_free", args: { synthDefNames: names } };
}
/** `/d_load` — Load a SynthDef file. */
export function dLoad(pathnameOfFile: string, completionMsg?: Uint8Array): ServerMessage {
  return { address: "/d_load", args: { pathnameOfFile, completionMsg } };
}
/** `/d_loadDir` — Load all SynthDefs in a directory. */
export function dLoadDir(pathnameOfDirectory: string, completionMsg?: Uint8Array): ServerMessage {
  return { address: "/d_loadDir", args: { pathnameOfDirectory, completionMsg } };
}
/** `/d_recv` — Install a compiled SynthDef. */
export function dRecv(bytes: Uint8Array, completionMsg?: Uint8Array): ServerMessage {
  return { address: "/d_recv", args: { bufferOfData: bytes, completionMsg } };
}
