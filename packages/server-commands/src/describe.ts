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
import { COMMANDS, isKnownAddress, type ValueType } from "./spec.js";

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
  const args = "args" in msg ? msg.args : undefined;
  if (!isKnownAddress(msg.address)) return Array.isArray(args) ? args.map(val) : [];
  const command = COMMANDS.get(msg.address);
  if (!command || args === undefined || Array.isArray(args)) return [];
  const payload = args as unknown as Record<string, unknown>;
  const out: unknown[] = [];
  for (const field of command.fields) {
    const value = payload[toCamel(field.name)];
    const form = field.form;
    if (form === "blob") out.push(value);
    else if (form === "completion") {
      if (value !== undefined) out.push(value);
    } else if (form === "variadic") out.push(...(value as object[]).map(val));
    else if ("scalar" in form) out.push(value);
    else if ("optionScalar" in form) {
      if (value !== undefined) out.push(value);
    } else if ("list" in form)
      out.push(...(value as unknown[]).map((item) => typedValue(form.list, item)));
    else if ("tail" in form) {
      out.push(
        ...(value as unknown[][]).flatMap((tuple) =>
          tuple.map((item, index) => typedValue(form.tail[index], item)),
        ),
      );
    } else {
      const { head, values } = form.setnTail;
      out.push(
        ...(value as [unknown, unknown[]][]).flatMap(([h, vs]) => [
          typedValue(head, h),
          vs.length,
          ...vs.map((item) => typedValue(values, item)),
        ]),
      );
    }
  }
  return out;
}

const toCamel = (name: string) => name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const typedValue = (type: ValueType, value: unknown): unknown =>
  type === "controlId" || type === "numericValue" || type === "controlValue" || type === "oscArg"
    ? val(value as object)
    : value;

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
