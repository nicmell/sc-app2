// Plain packet ⇆ binary round trips at the worker codec boundary. These tests
// cover the codec directly; worker message routing remains intentionally thin.

import { describe, expect, it } from "vitest";
import { clockPing, dRecv, sync, type OscPacket } from "@sc-app/server-commands";
import { decode, encode } from "@sc-app/server-commands/codec";

describe("OSC worker codec", () => {
  it("round-trips message atomic args", () => {
    const packet: OscPacket = {
      address: "/types",
      args: [7, 1.5, "hello", new Uint8Array([1, 2, 3, 4])],
    };
    expect(decode(encode(packet))).toEqual(packet);
  });

  it("encodes a nested completion packet as a blob", () => {
    const packet = dRecv(new Uint8Array([83, 67, 103, 102]), sync(42));
    const decoded = decode(encode(packet));
    expect(decoded).toEqual({
      address: "/d_recv",
      args: [new Uint8Array([83, 67, 103, 102]), encode(sync(42))],
    });
  });

  it("encodes clock ping as an int-only message", () => {
    const bytes = encode(clockPing(7));
    expect(new TextDecoder().decode(bytes)).toContain(",i");
    expect(decode(bytes)).toEqual({ address: "/clock/ping", args: [7] });
  });

  it("decodes the Rust clock pong double fixture", () => {
    const bytes = new Uint8Array([
      0x2f, 0x63, 0x6c, 0x6f, 0x63, 0x6b, 0x2f, 0x70, 0x6f, 0x6e, 0x67, 0x00, 0x2c, 0x69, 0x64,
      0x00, 0x00, 0x00, 0x00, 0x07, 0x42, 0x78, 0xbc, 0xfe, 0x56, 0x80, 0x08, 0x00,
    ]);
    expect(decode(bytes)).toEqual({
      address: "/clock/pong",
      args: [7, 1_700_000_000_000.5],
    });
  });

  it("round-trips bundle timetags and inbound nested bundles", () => {
    const packet: OscPacket = {
      timetag: 1_800_000_000_000,
      packets: [
        { address: "/first", args: [1] },
        {
          timetag: 1_800_000_000_250,
          packets: [{ address: "/second", args: ["two"] }],
        },
      ],
    };
    expect(decode(encode(packet))).toEqual(packet);
  });
});
