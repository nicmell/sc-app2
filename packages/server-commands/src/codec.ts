/**
 * Binary OSC codec. This is the package's only osc-js dependency site and is
 * exposed separately so the main-thread entry stays plain-data-only.
 */

import OSC from "osc-js";
import { isMessage, type OscArg, type OscPacket } from "./types";

// osc-js's string decoder probes `global`-else-`window` (hasProperty, lib/osc.js),
// and a Web Worker scope has neither — alias `global` so unpack works everywhere.
(globalThis as { global?: typeof globalThis }).global ??= globalThis;

function toOsc(packet: OscPacket): OSC.Message | OSC.Bundle {
  if (isMessage(packet)) {
    const args = packet.args.map((arg) => {
      return typeof arg === "object" && !(arg instanceof Uint8Array) ? encode(arg) : arg;
    });
    return new OSC.Message(packet.address, ...(args as OSC.Message["args"]));
  }
  return new OSC.Bundle(packet.packets.map(toOsc), packet.timetag);
}

/** Serialise a plain message or bundle to OSC binary. */
export function encode(packet: OscPacket): Uint8Array {
  return toOsc(packet).pack();
}

function fromOsc(packet: OSC.Message | OSC.Bundle): OscPacket {
  if (packet instanceof OSC.Message) {
    return { address: packet.address, args: packet.args as OscArg[] };
  }
  return {
    // osc-js's timestamp() getter rounds the NTP fraction to a whole second;
    // reconstruct milliseconds directly so scheduled bundles retain ms precision.
    timetag: Math.round(
      (packet.timetag.value.seconds - 2_208_988_800 + packet.timetag.value.fractions / 2 ** 32) *
        1000,
    ),
    packets: packet.bundleElements.map((element) => fromOsc(element as OSC.Message | OSC.Bundle)),
  };
}

/** Parse OSC binary into plain data. Inbound blobs remain Uint8Array values. */
export function decode(bytes: Uint8Array): OscPacket {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const packet = new OSC.Packet();
  packet.unpack(view);
  return fromOsc(packet.value);
}
