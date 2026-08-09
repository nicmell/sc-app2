/**
 * Shared type primitives. We deliberately *don't* ship a custom
 * discriminated union for every OSC address. The wire model is deliberately
 * plain data so packets cross the worker boundary through structured clone.
 */

/** OSC atomic types we use on the wire: int32, float32, string, blob. */
import type { Timetag } from "./timetag";

/** A number the codec must encode as an OSC double (`d`) instead of the
 *  inferred int32/float32 — sub-ms timestamps (the `/clock/*` family) need
 *  the f64 mantissa. Decode returns plain numbers either way. */
export interface OscDouble {
  type: "d";
  value: number;
}

/** OSC atomic values used by the app. Packet-shaped outbound args are encoded
 *  as OSC blobs by the codec; decoded blobs remain Uint8Array values. */
export type OscArg = number | string | Uint8Array | OscDouble | OscPacket;

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

export function isOscDouble(arg: unknown): arg is OscDouble {
  return (
    typeof arg === "object" &&
    arg !== null &&
    !(arg instanceof Uint8Array) &&
    "type" in arg &&
    arg.type === "d"
  );
}

/** Control can be addressed by name (string) or zero-based index (int). */
export type ControlKey = string | number;

/** Control values are numbers or bus-map strings like `"c10"` / `"a2"`. */
export type ControlValue = number | string;
