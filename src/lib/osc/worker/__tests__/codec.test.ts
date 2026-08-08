// Plain packet ⇆ binary round trips at the worker codec boundary. These tests
// cover the codec directly; worker message routing remains intentionally thin.

import { describe, expect, it } from "vitest";
import { dRecv, sync, type OscPacket } from "@sc-app/server-commands";
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
