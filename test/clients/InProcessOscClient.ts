// An OscClient that runs the bridge core directly in-process — no worker, no
// postMessage. The default test client: exercises the real controllers + OSC
// decode + WebSocket-to-server path. Uses Node 22's global WebSocket (the
// transport is WHATWG-compliant), so it needs no browser shims.

import { encode, type OscPacket } from "@sc-app/server-commands";
import { createOscBridge, type OscBridge } from "../../src/osc/bridge";
import type {
  ErrorListener,
  OscClient,
  ReplyListener,
  ScopeChunkListener,
} from "../../src/osc/OscClient";

export class InProcessOscClient implements OscClient {
  private readonly bridge: OscBridge;
  private readonly replyListeners = new Set<ReplyListener>();
  private readonly errorListeners = new Set<ErrorListener>();
  private readonly scopeChunkListeners = new Set<ScopeChunkListener>();

  readonly ready: Promise<void>;

  constructor(url: string) {
    this.bridge = createOscBridge(url, {
      onReply: (reply) => {
        for (const cb of this.replyListeners) cb(reply);
      },
      onScopeChunk: (chunk) => {
        for (const cb of this.scopeChunkListeners) cb(chunk);
      },
      onError: (message) => {
        for (const cb of this.errorListeners) cb(message);
      },
      onClose: () => {
        for (const cb of this.errorListeners) cb("websocket closed");
      },
    });
    this.ready = this.bridge.ready;
  }

  sendCommand(packet: OscPacket): void {
    this.bridge.send(encode(packet));
  }

  onReply(cb: ReplyListener): () => void {
    this.replyListeners.add(cb);
    return () => this.replyListeners.delete(cb) as unknown as void;
  }

  onError(cb: ErrorListener): () => void {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb) as unknown as void;
  }

  onScopeChunk(cb: ScopeChunkListener): () => void {
    this.scopeChunkListeners.add(cb);
    return () => this.scopeChunkListeners.delete(cb) as unknown as void;
  }

  dispose(): void {
    void this.bridge.close();
    this.replyListeners.clear();
    this.errorListeners.clear();
    this.scopeChunkListeners.clear();
  }
}
