// An OscClient that runs the bridge core directly in-process — no worker, no
// postMessage. The default test client: exercises the real controllers + OSC
// decode + WebSocket-to-server path. Uses Node 22's global WebSocket (the
// transport is WHATWG-compliant), so it needs no browser shims.

import { encode, type DecodedScopeChunk, type OscPacket } from "@sc-app/server-commands";
import { createOscBridge, type OscBridge } from "../../src/osc/bridge";
import type { ErrorListener, OscClient, ReplyListener, ScopeChunkListener } from "../../src/osc/OscClient";
import type { OscReply } from "../../src/types/protocol";
import { listenerGroup } from "../../src/osc/listenerGroup";

export class InProcessOscClient implements OscClient {
  private readonly bridge: OscBridge;
  private readonly replies = listenerGroup<OscReply>();
  private readonly errors = listenerGroup<string>();
  private readonly scopeChunks = listenerGroup<DecodedScopeChunk>();

  readonly ready: Promise<void>;

  constructor(url: string) {
    this.bridge = createOscBridge(url, {
      onReply: (reply) => this.replies.emit(reply),
      onScopeChunk: (chunk) => this.scopeChunks.emit(chunk),
      onError: (message) => this.errors.emit(message),
      onClose: () => this.errors.emit("websocket closed"),
    });
    this.ready = this.bridge.ready;
  }

  sendCommand(packet: OscPacket): void {
    this.bridge.send(encode(packet));
  }

  onReply(cb: ReplyListener): () => void {
    return this.replies.add(cb);
  }

  onError(cb: ErrorListener): () => void {
    return this.errors.add(cb);
  }

  onScopeChunk(cb: ScopeChunkListener): () => void {
    return this.scopeChunks.add(cb);
  }

  dispose(): void {
    void this.bridge.close();
    this.replies.clear();
    this.errors.clear();
    this.scopeChunks.clear();
  }
}
