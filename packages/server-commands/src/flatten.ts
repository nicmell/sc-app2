// Flatten an OSC packet into per-message `(address, args)` entries — a bundle
// recurses to its inner messages. Useful for decoding inbound rx and for logging
// outbound tx (where the caller already holds the packet, no need to re-decode).

import { isBundle, isMessage, type OscPacket } from './encode';

export interface FlatOsc {
  address: string;
  args: string[];
}

export function flattenPacket(packet: OscPacket): FlatOsc[] {
  const out: FlatOsc[] = [];
  walk(packet, out);
  return out;
}

/** One OSC arg as display text — binary args (e.g. a /d_recv SynthDef blob)
 *  render as a size tag instead of a byte list. */
export function formatOscArg(arg: unknown): string {
  if (arg instanceof Uint8Array || arg instanceof ArrayBuffer) {
    return `blob(${arg.byteLength}B)`;
  }
  return String(arg);
}

function walk(packet: OscPacket, out: FlatOsc[]): void {
  if (isBundle(packet)) {
    for (const el of packet.bundleElements) walk(el as OscPacket, out);
  } else if (isMessage(packet)) {
    out.push({ address: packet.address, args: (packet.args ?? []).map(formatOscArg) });
  }
}
