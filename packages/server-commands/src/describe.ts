/**
 * Display helpers for the OSC console log — no wasm crossings for the
 * typed paths. Both directions carry their wire address ON the value
 * (`msg.address` / `reply.address` — the serde tag), so there is no
 * tag↔address mapping anywhere; what remains here is only the wire-ORDER
 * rendering of each shape's fields. `flattenEncoded` is the byte-level
 * fallback the TESTS use to assert wire truth.
 */

import type { OtherMsg, ServerMessage, ServerReply } from "../pkg/scserver_commands.js";
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

const isOtherMsg = (msg: ServerMessage): msg is OtherMsg =>
  "args" in msg && Array.isArray(msg.args);

/** Flatten encoded OUTBOUND bytes (message or bundle) into per-message
 *  `{address, args}` entries by decoding what was actually sent — the
 *  test suites' wire-truth view. Command addresses decode as raw
 *  (address + args); an address the reply parser also knows renders
 *  through the typed reply view (lossy for display, never a throw). */
export function flattenEncoded(bytes: Uint8Array): FlatMessage[] {
  return decodeReplyPacket(bytes).map((reply) =>
    Array.isArray(reply.args)
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
  if (isOtherMsg(msg)) return msg.args.map(val);
  switch (msg.address) {
    case "/g_new":
    case "/n_run":
      return msg.args.tail.flat();
    case "/s_new":
      return [
        msg.args.defName,
        msg.args.nodeId,
        msg.args.addAction,
        msg.args.targetId,
        ...msg.args.tail.flatMap(([k, v]) => [val(k), val(v)]),
      ];
    case "/n_set":
      return [msg.args.nodeId, ...msg.args.tail.flatMap(([k, v]) => [val(k), val(v)])];
    case "/n_setn":
      return [
        msg.args.nodeId,
        ...msg.args.tail.flatMap(([k, values]) => [val(k), values.length, ...values.map(val)]),
      ];
    case "/n_free":
      return [...msg.args.nodeIds];
    case "/g_freeAll":
      return [...msg.args.groupIds];
    case "/d_recv":
      return [msg.args.bufferOfData, ...(msg.args.completionMsg !== undefined ? [msg.args.completionMsg] : [])];
    case "/d_free":
      return msg.args.synthDefNames;
    case "/sync":
      return [msg.args.aUniqueNumber];
    case "/scope/subscribe":
      return [msg.args.subId, msg.args.scope, msg.args.channels, msg.args.chunkSize];
    case "/scope/unsubscribe":
      return [msg.args.subId];
    case "/dirt/play":
      return msg.args.pairs.flatMap(([key, value]) => [key, val(value)]);
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
  if (Array.isArray(reply.args)) return reply.args.map(val);
  switch (reply.address) {
    case "/done":
      return [reply.args.command, ...reply.args.extras.map(val)];
    case "/fail":
      return [reply.args.command, reply.args.error, ...reply.args.extras.map(val)];
    case "/late":
      return [reply.args.seconds, reply.args.fractions, reply.args.lateSecs, reply.args.lateFracs];
    case "/n_go":
    case "/n_end":
    case "/n_on":
    case "/n_off":
    case "/n_move":
    case "/n_info":
      return [
        reply.args.nodeId,
        reply.args.parentId,
        reply.args.prevNode,
        reply.args.nextNode,
        reply.args.isGroup,
        ...(reply.args.headNode !== undefined ? [reply.args.headNode, reply.args.tailNode] : []),
      ];
    case "/status.reply":
      return [
        reply.args.unused,
        reply.args.numUgens,
        reply.args.numSynths,
        reply.args.numGroups,
        reply.args.numSynthDefs,
        reply.args.avgCpu,
        reply.args.peakCpu,
        reply.args.nominalSampleRate,
        reply.args.actualSampleRate,
      ];
    case "/tr":
      return [reply.args.nodeId, reply.args.triggerId, reply.args.value];
    case "/b_setn":
      return [reply.args.bufnum, reply.args.start, `floats(${reply.args.samples.length})`];
    case "/synced":
      return [reply.args.syncId];
    case "/scope/chunk":
      return [
        reply.args.subId,
        reply.args.tickIndex,
        reply.args.isGap ? 1 : 0,
        reply.args.channels,
        `floats(${reply.args.samples.length})`,
      ];
  }
  return [];
}
