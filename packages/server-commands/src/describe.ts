import type { ServerMessage } from "../pkg/scserver_commands.js";
import { decodeRawPacket, messageToOsc } from "./component.js";

export interface FlatMessage {
  address: string;
  args: Array<number | string | Uint8Array>;
}

export function formatOscArg(arg: unknown): string {
  if (arg instanceof Uint8Array || arg instanceof ArrayBuffer) return `blob(${arg.byteLength}B)`;
  return String(arg);
}

const val = (tagged: object) => Object.values(tagged)[0] as number | string | Uint8Array;

export function flattenEncoded(bytes: Uint8Array): FlatMessage[] {
  return decodeRawPacket(bytes).map(({ address, args }) => ({ address, args: args.map(val) }));
}

export function describeMessage(msg: ServerMessage): { address: string; args: string[] } {
  const { address, args } = messageToOsc(msg);
  return { address, args: args.map(val).map(formatOscArg) };
}
