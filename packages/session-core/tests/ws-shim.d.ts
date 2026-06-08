// Minimal ambient types for `ws` (avoids a network install of @types/ws). Only
// the surface the mock bridge uses.
declare module "ws" {
  export class WebSocket {
    binaryType: string;
    on(event: "message", cb: (data: Buffer | ArrayBuffer) => void): void;
    on(event: "close" | "error", cb: (...args: unknown[]) => void): void;
    send(data: Uint8Array | string): void;
    close(): void;
  }
  export class WebSocketServer {
    constructor(opts: { port?: number; host?: string });
    on(event: "connection", cb: (ws: WebSocket) => void): void;
    on(event: "listening", cb: () => void): void;
    on(event: "error", cb: (err: Error) => void): void;
    address(): { port: number } | string | null;
    close(cb?: () => void): void;
  }
}
