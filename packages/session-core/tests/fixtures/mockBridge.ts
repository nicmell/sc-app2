// In-process mock of the Rust bridge: a WebSocket server that the controllers
// connect to (via any OscClient). It ignores inbound frames and lets a test
// script emit OSC replies — /status.reply, /fail, /scope/chunk — to drive the
// controllers' reactive stores. Hermetic: no Rust, no scsynth.

import { WebSocket, WebSocketServer } from "ws";
import { OSC, encode, SCOPE_CHUNK_ADDRESS } from "@sc-app/server-commands";

export class MockBridge {
  private readonly wss: WebSocketServer;
  private readonly sockets = new Set<WebSocket>();
  private tick = 0;
  /** Resolves to `ws://127.0.0.1:<port>` once listening. */
  readonly url: Promise<string>;

  constructor() {
    this.wss = new WebSocketServer({ port: 0, host: "127.0.0.1" });
    this.wss.on("connection", (ws) => {
      ws.binaryType = "arraybuffer";
      this.sockets.add(ws);
      ws.on("close", () => this.sockets.delete(ws));
      ws.on("error", () => this.sockets.delete(ws));
      // Inbound frames (the controllers' commands) are accepted and ignored —
      // the test drives replies explicitly.
    });
    this.url = new Promise((resolve) => {
      this.wss.on("listening", () => {
        const addr = this.wss.address();
        const port = typeof addr === "object" && addr ? addr.port : 0;
        resolve(`ws://127.0.0.1:${port}`);
      });
    });
  }

  private broadcast(bytes: Uint8Array): void {
    for (const ws of this.sockets) ws.send(bytes);
  }

  /** Build an OSC message. osc-js accepts numbers/strings/Uint8Array(blob) at
   *  runtime; its arg typing is stricter, so we cast at this single boundary. */
  private message(address: string, args: Array<string | number | Uint8Array>) {
    return new OSC.Message(address, ...(args as never[]));
  }

  /** Emit an arbitrary OSC message to all connected clients. */
  emit(address: string, ...args: Array<string | number>): void {
    this.broadcast(encode(this.message(address, args)));
  }

  /** `/fail <command> <error>` — surfaces as a ScsynthError banner. */
  emitFail(command: string, message: string): void {
    this.emit("/fail", command, message);
  }

  /** `/status.reply` — drives the footer (avgCpu @5, peakCpu @6, sampleRate @8). */
  emitStatus(avgCpu = 12.5, peakCpu = 23.4, sampleRate = 48000): void {
    this.emit("/status.reply", 1, 0, 0, 0, 0, avgCpu, peakCpu, sampleRate, sampleRate);
  }

  /** `/scope/chunk subId tick isGap channels blob` — a big-endian f32 frame,
   *  matching the Rust bridge's wire format that parseScopeChunkArgs decodes. */
  emitScopeChunk(interleaved: number[], subId = 1, channels = 2): void {
    const blob = new Uint8Array(interleaved.length * 4);
    const dv = new DataView(blob.buffer);
    interleaved.forEach((v, i) => dv.setFloat32(i * 4, v, false)); // big-endian
    this.tick += 1;
    this.broadcast(encode(this.message(SCOPE_CHUNK_ADDRESS, [subId, this.tick, 0, channels, blob])));
  }

  async close(): Promise<void> {
    for (const ws of this.sockets) ws.close();
    await new Promise<void>((resolve) => this.wss.close(() => resolve()));
  }
}
