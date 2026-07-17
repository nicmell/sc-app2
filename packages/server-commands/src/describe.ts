/**
 * Display helpers for the OSC console log — no wasm crossings.
 *
 * Outbound entries render straight from the typed `ServerMessage`
 * (`describeMessage`): the worker already holds the value it encodes, so
 * re-decoding the bytes just for the log would double the component
 * crossings on every send. Inbound entries render from the typed
 * `ServerReply` (`describeReply`). `flattenEncoded` is the byte-level
 * fallback the TESTS use to assert wire truth — and it tolerates outbound
 * addresses that double as typed replies (`/b_setn` is both a command and
 * a reply) by rendering them through the reply view instead of throwing.
 */

import type {
  ControlId,
  ControlValue,
  NumericValue,
  ServerMessage,
} from "../pkg/interfaces/scserver-commands-commands.js";
import type { ServerReply } from "../pkg/interfaces/scserver-commands-replies.js";
import type { OscArg } from "../pkg/interfaces/scserver-commands-core.js";
import { decodeReplyPacket, encode } from "./component.js";

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

const unwrapArg = (arg: OscArg) => arg.val;
const idVal = (id: ControlId) => id.val;
const numVal = (v: NumericValue | ControlValue) => v.val;

/** Flatten encoded OUTBOUND bytes (message or bundle) into per-message
 *  `{address, args}` entries by decoding what was actually sent — the
 *  test suites' wire-truth view. Command addresses decode as `other`
 *  (raw args); an address the reply parser also knows renders through
 *  the typed reply view (lossy for display, never a throw). */
export function flattenEncoded(bytes: Uint8Array): FlatMessage[] {
  return decodeReplyPacket(bytes).map((reply) =>
    reply.tag === "other"
      ? { address: reply.val.address, args: reply.val.args.map(unwrapArg) }
      : {
          address: REPLY_ADDRESSES[reply.tag],
          args: replyArgs(reply) as FlatMessage["args"],
        },
  );
}

/** Render one OUTBOUND typed command for the tx log: its wire address plus
 *  its args in wire order, formatted as display text. Covers the commands
 *  the app speaks (the builders' surface); anything else falls back to one
 *  encode+decode roundtrip so the log stays total. */
export function describeMessage(msg: ServerMessage): { address: string; args: string[] } {
  const flat = messageArgs(msg);
  if (flat) return { address: flat.address, args: flat.args.map(formatOscArg) };
  const [fallback] = flattenEncoded(encode(msg));
  return { address: fallback.address, args: fallback.args.map(formatOscArg) };
}

function messageArgs(msg: ServerMessage): { address: string; args: unknown[] } | null {
  switch (msg.tag) {
    case "g-new":
      return { address: "/g_new", args: msg.val.tail.flat() };
    case "s-new": {
      const v = msg.val;
      return {
        address: "/s_new",
        args: [
          v.defName,
          v.nodeId,
          v.addAction,
          v.targetId,
          ...v.tail.flatMap(([k, val]) => [idVal(k), numVal(val)]),
        ],
      };
    }
    case "n-set":
      return {
        address: "/n_set",
        args: [msg.val.nodeId, ...msg.val.tail.flatMap(([k, v]) => [idVal(k), numVal(v)])],
      };
    case "n-setn":
      return {
        address: "/n_setn",
        args: [
          msg.val.nodeId,
          ...msg.val.tail.flatMap(([k, values]) => [
            idVal(k),
            values.length,
            ...values.map(numVal),
          ]),
        ],
      };
    case "n-run":
      return { address: "/n_run", args: msg.val.tail.flat() };
    case "n-free":
      return { address: "/n_free", args: [...msg.val.nodeIds] };
    case "g-free-all":
      return { address: "/g_freeAll", args: [...msg.val.groupIds] };
    case "d-recv":
      return {
        address: "/d_recv",
        args: [
          msg.val.bufferOfData,
          ...(msg.val.completionMsg !== undefined ? [msg.val.completionMsg] : []),
        ],
      };
    case "d-free":
      return { address: "/d_free", args: msg.val.synthDefNames };
    case "sync":
      return { address: "/sync", args: [msg.val.aUniqueNumber] };
    case "scope-subscribe": {
      const v = msg.val;
      return { address: "/scope/subscribe", args: [v.subId, v.scope, v.channels, v.chunkSize] };
    }
    case "scope-unsubscribe":
      return { address: "/scope/unsubscribe", args: [msg.val.subId] };
    case "other":
      return { address: msg.val.address, args: msg.val.args.map(unwrapArg) };
    default:
      return null;
  }
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
