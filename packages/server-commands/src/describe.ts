/**
 * Display helpers for the OSC console log. Two directions, two shapes:
 * outbound bytes flatten through a real decode (wire truth — every command
 * address is unknown to the reply parser, so it comes back as `other` with
 * the raw args), inbound TYPED replies render from their payload fields.
 */

import type { ServerReply } from "../pkg/interfaces/scserver-commands-replies.js";
import type { OscArg } from "../pkg/interfaces/scserver-commands-core.js";
import { decodeReplyPacket } from "./component.js";

/** One wire message flattened for logs/assertions: the address plus its
 *  raw arg values (blobs stay `Uint8Array`). */
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

function unwrapArg(arg: OscArg): number | string | Uint8Array {
  return arg.val;
}

/** Flatten encoded OUTBOUND bytes (message or bundle) into per-message
 *  `{address, args}` entries by decoding what was actually sent. */
export function flattenEncoded(bytes: Uint8Array): FlatMessage[] {
  return decodeReplyPacket(bytes).map((reply) => {
    if (reply.tag !== "other") {
      throw new Error(`flattenEncoded: outbound address decodes as a typed reply (${reply.tag})`);
    }
    return { address: reply.val.address, args: reply.val.args.map(unwrapArg) };
  });
}

const REPLY_ADDRESSES: Record<Exclude<ServerReply["tag"], "other">, string> = {
  done: "/done",
  fail: "/fail",
  late: "/late",
  "n-go": "/n_go",
  "n-end": "/n_end",
  "n-on": "/n_on",
  "n-off": "/n_off",
  "n-move": "/n_move",
  "n-info": "/n_info",
  "status-reply": "/status.reply",
  tr: "/tr",
  "b-setn": "/b_setn",
  synced: "/synced",
  "scope-chunk": "/scope/chunk",
};

/** Render one INBOUND typed reply for the rx log: its wire address plus its
 *  payload fields in wire order, formatted as display text. */
export function describeReply(reply: ServerReply): { address: string; args: string[] } {
  const address = reply.tag === "other" ? reply.val.address : REPLY_ADDRESSES[reply.tag];
  return { address, args: replyArgs(reply).map(formatOscArg) };
}

function replyArgs(reply: ServerReply): unknown[] {
  switch (reply.tag) {
    case "done":
      return [reply.val.address, ...reply.val.extras.map(unwrapArg)];
    case "fail":
      return [reply.val.address, reply.val.error, ...reply.val.extras.map(unwrapArg)];
    case "late":
      return [reply.val.seconds, reply.val.fractions, reply.val.lateSecs, reply.val.lateFracs];
    case "n-go":
    case "n-end":
    case "n-on":
    case "n-off":
    case "n-move":
    case "n-info": {
      const n = reply.val;
      return [
        n.nodeId,
        n.parentId,
        n.prevId,
        n.nextId,
        n.isGroup,
        ...(n.headId !== undefined ? [n.headId, n.tailId] : []),
      ];
    }
    case "status-reply": {
      const s = reply.val;
      return [
        s.unused,
        s.numUgens,
        s.numSynths,
        s.numGroups,
        s.numSynthDefs,
        s.avgCpu,
        s.peakCpu,
        s.nominalSampleRate,
        s.actualSampleRate,
      ];
    }
    case "tr":
      return [reply.val.nodeId, reply.val.triggerId, reply.val.value];
    case "b-setn":
      return [reply.val.bufnum, reply.val.start, `floats(${reply.val.samples.length})`];
    case "synced":
      return [reply.val.syncId];
    case "scope-chunk": {
      const c = reply.val;
      return [c.subId, c.tickIndex, c.isGap ? 1 : 0, c.channels, `floats(${c.samples.length})`];
    }
    case "other":
      return reply.val.args.map(unwrapArg);
  }
}
