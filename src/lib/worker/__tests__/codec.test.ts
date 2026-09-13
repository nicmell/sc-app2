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

  it("encodes clock ping as an int-pair message", () => {
    const bytes = encode(clockPing(41, 7));
    expect(new TextDecoder().decode(bytes)).toContain(",ii");
    expect(decode(bytes)).toEqual({ address: "/clock/ntp/ping", args: [41, 7] });
  });

  it("decodes the sclang clock pong fixture (keep in sync with ScAppClock.sc)", () => {
    // [clientId:i=7, seq:i=3, secs:i=1_700_000_000, fracMs:f=250.5] — the
    // split encoding NetAddr can emit (no OSC doubles in sclang).
    const bytes = new Uint8Array([
      0x2f, 0x63, 0x6c, 0x6f, 0x63, 0x6b, 0x2f, 0x6e, 0x74, 0x70, 0x2f, 0x70, 0x6f, 0x6e, 0x67,
      0x00, 0x2c, 0x69, 0x69, 0x69, 0x66, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0x00, 0x00,
      0x00, 0x03, 0x65, 0x53, 0xf1, 0x00, 0x43, 0x7a, 0x80, 0x00,
    ]);
    expect(decode(bytes)).toEqual({
      address: "/clock/ntp/pong",
      args: [7, 3, 1_700_000_000, 250.5],
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
