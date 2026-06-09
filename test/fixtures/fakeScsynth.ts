// A scriptable fake scsynth on UDP, for Tier-2 scenarios that run the real Rust
// `serve` without a real SuperCollider server. It completes the bridge's
// registration handshake (/notify → /done /notify, /version → /version.reply),
// answers the /status heartbeat, and exposes `emit()` so a scenario can push an
// arbitrary reply (e.g. /fail) back through the bridge to the connected clients.
// It cannot produce SHM scope data — that needs the real scsynth.
//
// Typed OSC encoder (i/f/d/s) is hand-rolled so clientId etc. are int32 (the
// Rust supervisor's classify_reply only accepts Int/Long for those).

import dgram from "node:dgram";

type OscType = "i" | "f" | "d" | "s";

function pad4(n: number): number {
  return (4 - (n % 4)) % 4;
}
function ostr(s: string): Buffer {
  const b = Buffer.from(s, "ascii");
  return Buffer.concat([b, Buffer.alloc(1 + pad4(b.length + 1))]);
}
function encode(addr: string, types: OscType[], args: Array<number | string>): Buffer {
  const parts: Buffer[] = [ostr(addr), ostr("," + types.join(""))];
  types.forEach((t, i) => {
    const v = args[i];
    if (t === "i") {
      const b = Buffer.alloc(4);
      b.writeInt32BE(v as number);
      parts.push(b);
    } else if (t === "f") {
      const b = Buffer.alloc(4);
      b.writeFloatBE(v as number);
      parts.push(b);
    } else if (t === "d") {
      const b = Buffer.alloc(8);
      b.writeDoubleBE(v as number);
      parts.push(b);
    } else {
      parts.push(ostr(v as string));
    }
  });
  return Buffer.concat(parts);
}
function addrOf(buf: Buffer): string {
  const end = buf.indexOf(0);
  return buf.toString("ascii", 0, end < 0 ? buf.length : end);
}

export interface FakeScsynth {
  readonly port: number;
  /** Push an OSC reply to the bridge (which fans it out to connected clients). */
  emit(addr: string, types: OscType[], args: Array<number | string>): void;
  close(): Promise<void>;
}

export function startFakeScsynth(port = 57199, clientId = 0): Promise<FakeScsynth> {
  const sock = dgram.createSocket("udp4");
  let last: { port: number; address: string } | null = null;

  sock.on("message", (msg, rinfo) => {
    last = { port: rinfo.port, address: rinfo.address };
    const addr = addrOf(msg);
    const reply = (buf: Buffer) => sock.send(buf, rinfo.port, rinfo.address);
    if (addr === "/notify") {
      reply(encode("/done", ["s", "i"], ["/notify", clientId]));
    } else if (addr === "/version") {
      reply(encode("/version.reply", ["s", "i", "i", "s", "s", "s"], ["scsynth", 3, 14, ".1", "fake", "0"]));
    } else if (addr === "/status") {
      reply(encode("/status.reply", ["i", "i", "i", "i", "i", "f", "f", "d", "d"], [1, 0, 0, 0, 0, 1.5, 2.5, 48000, 48000]));
    }
    // /g_new and everything else: silently accept.
  });

  return new Promise((resolve) => {
    sock.bind(port, "127.0.0.1", () => {
      resolve({
        port,
        emit(addr, types, args) {
          if (last) sock.send(encode(addr, types, args), last.port, last.address);
        },
        close: () => new Promise<void>((r) => sock.close(() => r())),
      });
    });
  });
}
