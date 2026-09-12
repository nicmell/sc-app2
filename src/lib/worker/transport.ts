// The worker-side byte transport: the raw WebSocket and nothing else —
// open/close/send bytes in, open/frame/error/close out. A frame is one
// complete packed OSC packet (a WS message is a frame). The codec and all
// protocol routing live in the WorkerEndpoint (endpoint.ts).
//
// The hosting worker is permanent (the WorkerClient spawns it once), so
// connections come and go over this one transport: `open` silently disposes
// a previous socket — its events can never surface after the new
// connection's subscribers are in place — and an orderly `close` emits no
// event: the main-thread WorkerClient synthesizes the single close signal.

/** One event from the wire. */
export type WireEvent =
  | { type: "open" }
  | { type: "data"; data: ArrayBuffer }
  | { type: "error"; message: string }
  | { type: "close"; code?: number; reason?: string };

export class Transport {
  private ws: WebSocket | null = null;
  private notify: (event: WireEvent) => void = () => {};

  /** Register the consumer of wire events (one listener). */
  onEvent(cb: (event: WireEvent) => void): void {
    this.notify = cb;
  }

  open(url: string): void {
    this.dispose();
    console.log("[sc:transport] opening ws", url);
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      console.log("[sc:transport] ws open");
      this.notify({ type: "open" });
    };
    ws.onmessage = (e) => {
      // Ignore text frames — the bridge only sends binary.
      if (e.data instanceof ArrayBuffer) this.notify({ type: "data", data: e.data });
    };
    ws.onerror = () => {
      console.error("[sc:transport] ws error");
      this.notify({ type: "error", message: "websocket error" });
    };
    ws.onclose = (e) => {
      console.warn("[sc:transport] ws close", e.code, e.reason || "(no reason)");
      this.notify({ type: "close", code: e.code, reason: e.reason || undefined });
    };
  }

  /** Orderly close: emits nothing. */
  close(): void {
    this.dispose();
  }

  /** Relay one packed OSC frame. */
  send(data: Uint8Array): void {
    if (!this.ws) {
      this.notify({ type: "error", message: "send before open" });
      return;
    }
    this.ws.send(data);
  }

  /** Detach + close the current socket without emitting anything. */
  private dispose(): void {
    if (!this.ws) return;
    this.ws.onopen = this.ws.onmessage = this.ws.onerror = this.ws.onclose = null;
    this.ws.close();
    this.ws = null;
  }
}
