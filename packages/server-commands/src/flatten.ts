// Flatten an OSC packet into per-message `(address, args)` entries — a bundle
// recurses to its inner messages. Useful for decoding inbound rx and for logging
// outbound tx (where the caller already holds the packet, no need to re-decode).

import { isBundle, isMessage, type OscMessage, type OscPacket } from "./types";

export interface FlatOsc {
  address: string;
  args: string[];
}

export function flattenPacket(packet: OscPacket): FlatOsc[] {
  const out: FlatOsc[] = [];
  walkPacket(packet, (message) => {
    out.push({ address: message.address, args: message.args.map(formatOscArg) });
  });
  return out;
}

export function walkPacket(packet: OscPacket, fn: (message: OscMessage) => void): void {
  if (isMessage(packet)) fn(packet);
  else if (isBundle(packet)) for (const child of packet.packets) walkPacket(child, fn);
}

/** One OSC arg as display text — binary args (e.g. a /d_recv SynthDef blob)
 *  render as a size tag instead of a byte list, and a packet-shaped arg (an
 *  embedded completion message, encoded to a blob by the codec) as its
 *  address. */
export function formatOscArg(arg: unknown): string {
  if (arg instanceof Uint8Array || arg instanceof ArrayBuffer) {
    return `blob(${arg.byteLength}B)`;
  }
  if (typeof arg === "object" && arg !== null) {
    return "address" in arg ? `packet(${String(arg.address)})` : "packet(#bundle)";
  }
  return String(arg);
}
