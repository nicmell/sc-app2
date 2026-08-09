/**
 * Shared type primitives. We deliberately *don't* ship a custom
 * discriminated union for every OSC address. The wire model is deliberately
 * plain data so packets cross the worker boundary through structured clone.
 */

/** OSC atomic types we use on the wire: int32, float32, string, blob. */
import type { Timetag } from "./timetag";

/** OSC atomic values used by the app. Packet-shaped outbound args are encoded
 *  as OSC blobs by the codec; decoded blobs remain Uint8Array values. */
export type OscArg = number | string | Uint8Array | OscPacket;

export interface OscMessage {
  address: string;
  args: OscArg[];
}

export interface OscBundle {
  timetag: Timetag;
  packets: OscPacket[];
}

export type OscPacket = OscMessage | OscBundle;

export function isMessage(packet: OscPacket): packet is OscMessage {
  return "address" in packet;
}

export function isBundle(packet: OscPacket): packet is OscBundle {
  return "timetag" in packet;
}

/** Control can be addressed by name (string) or zero-based index (int). */
export type ControlKey = string | number;

/** Control values are numbers or bus-map strings like `"c10"` / `"a2"`. */
export type ControlValue = number | string;
