// The package's honesty gate: every builder through the REAL wasm component
// (encode → flattenEncoded pins the wire view the app suites assert on),
// bundle scheduling through atUnixMs, and typed reply classification of
// bytes the bridge/scsynth would send.

import { describe, expect, it } from "vitest";
import {
  AddToTail,
  atUnixMs,
  decodeReply,
  decodeReplyPacket,
  describeMessage,
  dFree,
  dirtPlay,
  dRecv,
  encode,
  encodeBundle,
  flattenEncoded,
  formatOscArg,
  gFreeAll,
  gNew,
  nFree,
  nRun,
  nSet,
  nSetn,
  raw,
  scopeSubscribe,
  scopeUnsubscribe,
  sNew,
  sync,
  type ServerMessage,
} from "..";

// The OSC "immediate" tag (what invalid atUnixMs input clamps to).
const IMMEDIATE_TIME = { seconds: 0, fractional: 1 };

/** The single-message flat view most assertions want. */
const flat = (msg: Parameters<typeof encode>[0]) => flattenEncoded(encode(msg))[0];

describe("builders produce the exact wire messages", () => {
  it("node/group lifecycle commands", () => {
    expect(flat(gNew(2000, AddToTail, 1))).toEqual({ address: "/g_new", args: [2000, 1, 1] });
    expect(flat(sNew("sine", 2001, AddToTail, 2000, [["freq", 440.5]]))).toEqual({
      address: "/s_new",
      args: ["sine", 2001, 1, 2000, "freq", 440.5],
    });
    expect(flat(nRun(2001, 0))).toEqual({ address: "/n_run", args: [2001, 0] });
    expect(flat(nFree(2001, 2002))).toEqual({ address: "/n_free", args: [2001, 2002] });
    expect(flat(gFreeAll(2000))).toEqual({ address: "/g_freeAll", args: [2000] });
  });

  it("control writes type ints and floats like osc-js did", () => {
    expect(flat(nSet(9, { freq: 440, amp: 0.5 }))).toEqual({
      address: "/n_set",
      args: [9, "freq", 440, "amp", 0.5],
    });
    // The wire carries the run length between the control name and values.
    expect(flat(nSetn(9, "env", [0, 0.5, 1]))).toEqual({
      address: "/n_setn",
      args: [9, "env", 3, 0, 0.5, 1],
    });
    // A numeric control id stays an index, a string value a bus mapping.
    expect(flat(sNew("d", 1, 0, 0, [[4, "c7"]])).args).toEqual(["d", 1, 0, 0, 4, "c7"]);
  });

  it("synthdef installation with an embedded completion message", () => {
    const def = Uint8Array.from([83, 67, 103, 102]); // "SCgf"
    const message = flat(dRecv(def, encode(sync(7))));
    expect(message.address).toBe("/d_recv");
    expect(message.args[0]).toEqual(def);
    // The completion blob is itself a decodable /sync message.
    expect(flat(dFree("sine", "saw"))).toEqual({ address: "/d_free", args: ["sine", "saw"] });
    const completion = flattenEncoded(message.args[1] as Uint8Array)[0];
    expect(completion).toEqual({ address: "/sync", args: [7] });
  });

  it("scope protocol commands", () => {
    expect(flat(scopeSubscribe({ subId: 1, scope: 3, channels: 2, chunkSize: 1024 }))).toEqual({
      address: "/scope/subscribe",
      args: [1, 3, 2, 1024],
    });
    expect(flat(scopeUnsubscribe(1))).toEqual({ address: "/scope/unsubscribe", args: [1] });
  });

  it("raw escape hatch and dirt events", () => {
    expect(flat(raw("/status"))).toEqual({ address: "/status", args: [] });
    // 0.5 is dyadic — exact through the wire's float32 (0.9 would not be).
    expect(flat(dirtPlay({ s: "bd", n: 1, gain: 0.5 }))).toEqual({
      address: "/dirt/play",
      args: ["s", "bd", "n", 1, "gain", 0.5],
    });
  });
});

describe("bundles and timetags", () => {
  it("encodeBundle round-trips messages and the NTP tag", () => {
    const time = atUnixMs(0); // Unix epoch = NTP 2_208_988_800
    expect(time).toEqual({ seconds: 2_208_988_800, fractional: 0 });
    const bytes = encodeBundle(time, [dirtPlay({ s: "bd" }), sync(3)]);
    expect(flattenEncoded(bytes)).toEqual([
      { address: "/dirt/play", args: ["s", "bd"] },
      { address: "/sync", args: [3] },
    ]);
  });

  it("invalid wall-clock input clamps to the immediate tag", () => {
    expect(atUnixMs(-1)).toEqual(IMMEDIATE_TIME);
    expect(atUnixMs(Number.NaN)).toEqual(IMMEDIATE_TIME);
  });
});

describe("typed reply classification", () => {
  it("classifies the replies the worker routes on", () => {
    expect(decodeReply(encode(raw("/n_go", 2001, 1, -1, -1, 0)))).toEqual({
      tag: "n-go",
      val: { nodeId: 2001, parentId: 1, prevId: -1, nextId: -1, isGroup: 0 },
    });
    expect(decodeReply(encode(raw("/synced", 7)))).toEqual({
      tag: "synced",
      val: { syncId: 7 },
    });
    expect(decodeReply(encode(raw("/fail", "/s_new", "SynthDef not found")))).toEqual({
      tag: "fail",
      val: { address: "/s_new", error: "SynthDef not found", extras: [] },
    });
  });

  it("lifts scope-chunk samples as a transferable Float32Array", () => {
    // Build the wire blob big-endian, as the bridge emits it.
    const blob = new Uint8Array(8);
    new DataView(blob.buffer).setFloat32(0, 1, false);
    new DataView(blob.buffer).setFloat32(4, -1, false);
    const reply = decodeReply(encode(raw("/scope/chunk", 5, 9, 0, 2, blob)));
    if (reply.tag !== "scope-chunk") throw new Error(`expected scope-chunk, got ${reply.tag}`);
    expect(Array.from(reply.val.samples)).toEqual([1, -1]);
    expect(reply.val).toMatchObject({ subId: 5, tickIndex: 9, isGap: false, channels: 2 });
    expect(reply.val.samples.buffer.byteLength).toBeGreaterThan(0); // own buffer, transferable
  });

  it("decodeReplyPacket splits bundles and errors loudly on garbage", () => {
    const bundle = encodeBundle(IMMEDIATE_TIME, [raw("/synced", 1), raw("/synced", 2)]);
    expect(decodeReplyPacket(bundle).map((r) => r.tag)).toEqual(["synced", "synced"]);
    expect(() => decodeReply(Uint8Array.from([1, 2, 3]))).toThrow();
  });
});

describe("display formatting", () => {
  it("formatOscArg tags blobs by size", () => {
    expect(formatOscArg(new Uint8Array(16))).toBe("blob(16B)");
    expect(formatOscArg(440)).toBe("440");
  });

  it("describeMessage renders the same wire view flattenEncoded decodes (no crossings)", () => {
    // Every builder the worker's tx log renders typed — pin against the
    // byte-level truth so the two views can never drift.
    const msgs: ServerMessage[] = [
      gNew(2000, AddToTail, 1),
      sNew("sine", 2001, AddToTail, 2000, [["freq", 440.5]]),
      nSet(9, { freq: 440 }),
      nSetn(9, "env", [0, 0.5, 1]),
      nRun(2001, 0),
      nFree(2001, 2002),
      gFreeAll(2000),
      dFree("sine"),
      sync(7),
      scopeSubscribe({ subId: 1, scope: 3, channels: 2, chunkSize: 1024 }),
      scopeUnsubscribe(1),
      dirtPlay({ s: "bd", n: 1 }),
    ];
    for (const msg of msgs) {
      const wire = flattenEncoded(encode(msg))[0];
      expect(describeMessage(msg)).toEqual({
        address: wire.address,
        args: wire.args.map(formatOscArg),
      });
    }
    // The blob-carrying case renders size tags on both paths.
    const recv = dRecv(Uint8Array.from([83, 67, 103, 102]), encode(sync(7)));
    expect(describeMessage(recv).args.every((a) => a.startsWith("blob("))).toBe(true);
    // A typed-reply collision on the byte path renders instead of throwing.
    expect(flattenEncoded(encode(raw("/b_setn", 0, 0, 0)))[0].address).toBe("/b_setn");
  });
});
