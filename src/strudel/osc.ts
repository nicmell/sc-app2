// OSC over the bridge WebSocket.
//
// We encode `/dirt/play` bundles with osc-js on the main thread (osc-js is
// pure JS — no Web Worker needed) and ship them as binary WS frames. The
// bridge routes them by address to the StrudelDirt peer (UDP 57120).

import OSC from "osc-js";

/** A SuperDirt event: a flat bag of params (`s`, `n`, `gain`, `note`, …). */
export type DirtEvent = Record<string, string | number>;

export interface OscConnection {
  send(bytes: Uint8Array): void;
  close(): void;
}

/** Open the bridge WebSocket; resolves once it's connected. */
export function connectOsc(
  url: string,
  onClose: (ev: CloseEvent) => void,
): Promise<OscConnection> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    ws.onopen = () =>
      resolve({
        send: (bytes) => ws.readyState === WebSocket.OPEN && ws.send(bytes),
        close: () => ws.close(),
      });
    ws.onerror = () => reject(new Error("WebSocket error"));
    ws.onclose = onClose;
  });
}

/** Encode a `/dirt/play` bundle: flat `[key, value, …]` args, scheduled at
 *  `timetagMs` (a wall-clock ms timestamp — osc-js converts it to NTP). */
export function dirtPlayBytes(event: DirtEvent, timetagMs: number): Uint8Array {
  const args: Array<string | number> = [];
  for (const [k, v] of Object.entries(event)) args.push(k, v);
  const message = new OSC.Message("/dirt/play", ...args);
  const bundle = new OSC.Bundle([message], timetagMs);
  return bundle.pack();
}
