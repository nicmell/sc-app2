// OSC over the bridge WebSocket.
//
// The bridge is a dumb pipe: we send `/dirt/play` bundles as binary frames and
// it forwards peer replies back verbatim as binary. The OSC console logs both
// directions, so we decode each frame here (osc-js) into a log entry — `tx` for
// what we send, `rx` for what we receive.

import {
  OSC,
  encode,
  decode,
  isBundle,
  isMessage,
  atDate,
  type OscPacket,
} from "@sc-app/server-commands";

/** A SuperDirt event: a flat bag of params (`s`, `n`, `gain`, `note`, …). */
export type DirtEvent = Record<string, string | number>;

/** One decoded OSC message for the console. */
export interface OscLogEntry {
  ts: number; // client wall-clock ms
  dir: "tx" | "rx"; // tx = we sent it, rx = we received it
  address: string;
  args: string[];
}

export interface OscConnection {
  send(bytes: Uint8Array): void;
  close(): void;
}

export interface OscHandlers {
  onLog: (entry: OscLogEntry) => void;
  onClose: (ev: CloseEvent) => void;
}

/** Decode an OSC packet into `(address, args)` per message — a bundle flattens
 *  to its inner messages. Returns `[]` if the bytes don't decode. */
function decodeOsc(data: ArrayBuffer | Uint8Array): Array<{ address: string; args: string[] }> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const out: Array<{ address: string; args: string[] }> = [];
  try {
    flatten(decode(bytes), out);
  } catch {
    // non-OSC / malformed frame — skip
  }
  return out;
}

function flatten(packet: OscPacket, out: Array<{ address: string; args: string[] }>) {
  if (isBundle(packet)) {
    for (const el of packet.bundleElements) flatten(el as OscPacket, out);
  } else if (isMessage(packet)) {
    out.push({ address: packet.address, args: (packet.args ?? []).map((a) => String(a)) });
  }
}

/** Open the bridge WebSocket; resolves once connected. Outbound frames (via
 *  `send`) are logged as `tx`; inbound binary frames are decoded and logged
 *  as `rx`. */
export function connectOsc(url: string, handlers: OscHandlers): Promise<OscConnection> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";

    const log = (dir: "tx" | "rx", data: ArrayBuffer | Uint8Array) => {
      const ts = Date.now();
      for (const { address, args } of decodeOsc(data)) handlers.onLog({ ts, dir, address, args });
    };

    ws.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) log("rx", e.data);
    };
    ws.onopen = () =>
      resolve({
        send: (bytes) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          log("tx", bytes);
          ws.send(bytes);
        },
        close: () => ws.close(),
      });
    ws.onerror = () => reject(new Error("WebSocket error"));
    ws.onclose = handlers.onClose;
  });
}

/** Encode a `/dirt/play` bundle: flat `[key, value, …]` args, scheduled at
 *  `timetagMs` (a wall-clock ms timestamp — osc-js converts it to NTP). */
export function dirtPlayBytes(event: DirtEvent, timetagMs: number): Uint8Array {
  const args: Array<string | number> = [];
  for (const [k, v] of Object.entries(event)) args.push(k, v);
  const message = new OSC.Message("/dirt/play", ...args);
  const bundle = new OSC.Bundle([message], atDate(timetagMs));
  return encode(bundle);
}
