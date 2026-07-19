import { decodeRawPacket } from "./component.js";

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

/** Render already-encoded wire bytes for the tx log — the same raw decode
 *  the rx side uses, so both console directions are wire-true. */
export function describeEncoded(bytes: Uint8Array): FlatMessage[] {
  return flattenEncoded(bytes);
}
