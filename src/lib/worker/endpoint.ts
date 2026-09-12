// The worker-side protocol endpoint: the binary codec over the byte
// Transport, plus the composed session Watchdog — everything else passes
// straight through. The postMessage boundary carries plain MESSAGES only
// and NO clock vocabulary at all: outbound, the `at` metadata becomes the
// OSC bundle timetag here at encode time; inbound, bundles flatten to
// messages in wire order before posting up, and the global clock's /tr
// tick (the session heartbeat) additionally stamps the watchdog. The
// codec subpath is the worker's only route to osc-js. worker.ts is the
// thin entry composing the endpoint over the worker scope; OscClient
// (main thread) is the protocol brain on the other side of the
// WorkerClient boundary.

import { decode, encode } from "@sc-app/server-commands/codec";
import { atDate, walkPacket, type OscMessage } from "@sc-app/server-commands";
import { isClockTick } from "@/constants/osc";
import type { TransportCommand, TransportEvent } from "@/types/osc";
import { Watchdog } from "./watchdog";
import { Transport } from "./transport";

/** The transport surface the endpoint consumes (faked in tests). */
export type TransportLike = Pick<Transport, "open" | "close" | "send" | "onEvent">;

/** Collect a message's blob buffers so they cross postMessage zero-copy. */
function blobBuffers(message: OscMessage): Transferable[] {
  const out: Transferable[] = [];
  for (const arg of message.args) {
    if (arg instanceof Uint8Array) out.push(arg.buffer);
  }
  return out;
}

export class WorkerEndpoint {
  private readonly watchdog: Watchdog;

  constructor(
    private readonly post: (event: TransportEvent, transfer?: Transferable[]) => void,
    private readonly transport: TransportLike = new Transport(),
  ) {
    this.watchdog = new Watchdog({
      // Dead heartbeat → an ordinary transport error: the errors middleware
      // toasts it and OscClient's "a transport error is critical" policy
      // closes the session.
      onDead: () => {
        this.post({ type: "error", message: "global clock ticks stopped — closing" });
      },
    });
    this.transport.onEvent((event) => {
      switch (event.type) {
        case "open":
          this.watchdog.start();
          this.post(event);
          return;
        case "data":
          this.handleData(event.data);
          return;
        case "close":
          // A REMOTE close (an orderly close emits nothing — the main-thread
          // WorkerClient synthesizes the single close signal).
          this.watchdog.stop();
          this.post(event);
          return;
        case "error":
          this.post(event);
      }
    });
  }

  handleCommand(command: TransportCommand): void {
    switch (command.type) {
      case "open":
        this.transport.open(command.url);
        return;
      case "close":
        this.watchdog.stop();
        this.transport.close();
        return;
      case "osc": {
        const { packet, at } = command;
        try {
          // `at` (a bridge-time Unix-ms timetag) becomes the OSC bundle
          // here — the one place the wire's scheduling shape is built.
          this.transport.send(
            encode(at !== undefined ? { timetag: atDate(at), packets: [packet] } : packet),
          );
        } catch (error) {
          this.post({
            type: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  private handleData(data: ArrayBuffer): void {
    try {
      // Inbound bundles flatten to messages in wire order — bundles never
      // cross the postMessage boundary.
      walkPacket(decode(new Uint8Array(data)), (message) => {
        // The session heartbeat is EXACTLY the global clock's tick: only
        // the DSP graph computing proves the session alive (a pong or a
        // /status.reply from a clock-less stack must not).
        if (isClockTick(message)) this.watchdog.markAlive();
        this.post({ type: "osc", packet: message }, blobBuffers(message));
      });
    } catch (error) {
      this.post({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
