/**
 * Display helpers for the OSC console log — no wasm crossings for the
 * typed paths. Both directions carry their wire address ON the value
 * (`msg.address` / `reply.address` — the serde tag), so there is no
 * tag↔address mapping anywhere; what remains here is only the wire-ORDER
 * rendering of each shape's fields. `flattenEncoded` is the byte-level
 * fallback the TESTS use to assert wire truth.
 */

import type { ServerMessage, ServerReply } from "../pkg/scserver_commands.js";
import { decodeReplyPacket } from "./component.js";

/** One wire message flattened for logs/assertions: the address plus its
 *  raw arg values (blobs stay `Uint8Array`; a typed-reply collision may
 *  render a display string, e.g. `floats(N)` for a sample run). */
export interface FlatMessage {
  address: string;
  args: Array<number | string | Uint8Array>;
}

/** One value as display text — binary args (e.g. a /d_recv SynthDef blob)
 *  render as a size tag instead of a byte list. */
export function formatOscArg(arg: unknown): string {
  if (arg instanceof Uint8Array || arg instanceof ArrayBuffer) {
    return `blob(${arg.byteLength}B)`;
  }
  return String(arg);
}

/** Unwrap one tagged value (`{ int32: 5 }`, `{ name: "freq" }`, …) — every
 *  tagged-union leaf in the serde model is a one-key object. */
const val = (tagged: object) => Object.values(tagged)[0] as number | string | Uint8Array;

/** Flatten encoded OUTBOUND bytes (message or bundle) into per-message
 *  `{address, args}` entries by decoding what was actually sent — the
 *  test suites' wire-truth view. Command addresses decode as raw
 *  (address + args); an address the reply parser also knows renders
 *  through the typed reply view (lossy for display, never a throw). */
export function flattenEncoded(bytes: Uint8Array): FlatMessage[] {
  return decodeReplyPacket(bytes).map((reply) =>
    "args" in reply
      ? { address: reply.address, args: reply.args.map(val) }
      : { address: reply.address, args: replyArgs(reply) as FlatMessage["args"] },
  );
}

/** Render one OUTBOUND typed command for the tx log: its wire address plus
 *  its args in wire order, formatted as display text. Covers the commands
 *  the app speaks (the builders' surface); anything else renders as its
 *  address alone rather than guessing field order. */
export function describeMessage(msg: ServerMessage): { address: string; args: string[] } {
  return { address: msg.address, args: messageArgs(msg).map(formatOscArg) };
}

function messageArgs(msg: ServerMessage): unknown[] {
  // The escape hatch first — its `address: string` would otherwise defeat
  // the literal narrowing the switch below relies on.
  if ("args" in msg) return msg.args.map(val);
  switch (msg.address) {
    case "/g_new":
    case "/n_run":
      return msg.tail.flat();
    case "/s_new":
      return [
        msg.defName,
        msg.nodeId,
        msg.addAction,
        msg.targetId,
        ...msg.tail.flatMap(([k, v]) => [val(k), val(v)]),
      ];
    case "/n_set":
      return [msg.nodeId, ...msg.tail.flatMap(([k, v]) => [val(k), val(v)])];
    case "/n_setn":
      return [
        msg.nodeId,
        ...msg.tail.flatMap(([k, values]) => [val(k), values.length, ...values.map(val)]),
      ];
    case "/n_free":
      return [...msg.nodeIds];
    case "/g_freeAll":
      return [...msg.groupIds];
    case "/d_recv":
      return [msg.bufferOfData, ...(msg.completionMsg !== undefined ? [msg.completionMsg] : [])];
    case "/d_free":
      return msg.synthDefNames;
    case "/sync":
      return [msg.aUniqueNumber];
    case "/scope/subscribe":
      return [msg.subId, msg.scope, msg.channels, msg.chunkSize];
    case "/scope/unsubscribe":
      return [msg.subId];
    case "/dirt/play":
      return msg.pairs.flatMap(([key, value]) => [key, val(value)]);
    default:
      return [];
  }
}

/** Render one INBOUND typed reply for the rx log: its wire address plus its
 *  payload fields in wire order, formatted as display text. */
export function describeReply(reply: ServerReply): { address: string; args: string[] } {
  return { address: reply.address, args: replyArgs(reply).map(formatOscArg) };
}

function replyArgs(reply: ServerReply): unknown[] {
  if ("args" in reply) return reply.args.map(val);
  switch (reply.address) {
    case "/done":
      return [reply.command, ...reply.extras.map(val)];
    case "/fail":
      return [reply.command, reply.error, ...reply.extras.map(val)];
    case "/late":
      return [reply.seconds, reply.fractions, reply.lateSecs, reply.lateFracs];
    case "/n_go":
    case "/n_end":
    case "/n_on":
    case "/n_off":
    case "/n_move":
    case "/n_info":
      return [
        reply.nodeId,
        reply.parentId,
        reply.prevNode,
        reply.nextNode,
        reply.isGroup,
        ...(reply.headNode !== undefined ? [reply.headNode, reply.tailNode] : []),
      ];
    case "/status.reply":
      return [
        reply.unused,
        reply.numUgens,
        reply.numSynths,
        reply.numGroups,
        reply.numSynthDefs,
        reply.avgCpu,
        reply.peakCpu,
        reply.nominalSampleRate,
        reply.actualSampleRate,
      ];
    case "/tr":
      return [reply.nodeId, reply.triggerId, reply.value];
    case "/b_setn":
      return [reply.bufnum, reply.start, `floats(${reply.samples.length})`];
    case "/synced":
      return [reply.syncId];
    case "/scope/chunk":
      return [
        reply.subId,
        reply.tickIndex,
        reply.isGap ? 1 : 0,
        reply.channels,
        `floats(${reply.samples.length})`,
      ];
  }
}
