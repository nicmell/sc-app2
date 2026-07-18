/**
 * Builders for the commands the app actually speaks — each returns a plain
 * `ServerMessage` value in the crate's serde shape: a flat object whose
 * `address` field IS the discriminant (`{ address: "/s_new", defName, … }`).
 * Argument inference mirrors the OSC typing the old osc-js layer produced:
 * integer numbers become ints, non-integers floats, strings stay strings (a
 * control-value string is a `c`/`a` bus mapping), Uint8Array becomes a blob.
 */

import type {
  ControlId,
  ControlValue,
  NumericValue,
  OscArg,
  ServerMessage,
} from "../pkg/scserver_commands.js";

// scsynth add actions (`/s_new`, `/g_new` addAction arg).
export const AddToHead = 0;
export const AddToTail = 1;
export const AddBefore = 2;
export const AddAfter = 3;
export const AddReplace = 4;

/** THE numeric-typing rule (integer → int, else float — what osc-js
 *  encoded): one place to touch, three tagged-value spellings below. */
const isInt = (v: number) => Number.isInteger(v);

/** A control referenced by declared name or by index. */
function toControlId(key: string | number): ControlId {
  return typeof key === "string" ? { name: key } : { index: key };
}

function toNumericValue(v: number): NumericValue {
  return isInt(v) ? { int: v } : { float: v };
}

/** A control value: number (via the numeric rule) or a `c`/`a`-prefixed
 *  bus-mapping symbol. */
function toControlValue(v: number | string): ControlValue {
  return typeof v === "string" ? { bus: v } : toNumericValue(v);
}

/** One variadic OSC arg for the `other` escape hatch. */
function toOscArg(v: number | string | Uint8Array): OscArg {
  if (v instanceof Uint8Array) return { blob: v };
  if (typeof v === "string") return { string: v };
  return isInt(v) ? { int32: v } : { float32: v };
}

/** `/g_new` — create one group under `targetId`. */
export function gNew(groupId: number, addAction: number, targetId: number): ServerMessage {
  return { address: "/g_new", tail: [[groupId, addAction, targetId]] };
}

/** `/s_new` — spawn a synth with (control, value) pairs baked in. */
export function sNew(
  defName: string,
  nodeId: number,
  addAction: number,
  targetId: number,
  pairs: ReadonlyArray<readonly [string | number, number | string]> = [],
): ServerMessage {
  return {
    address: "/s_new",
    defName,
    nodeId,
    addAction,
    targetId,
    tail: pairs.map(([k, v]) => [toControlId(k), toControlValue(v)]),
  };
}

/** `/n_set` — set named/indexed scalar controls on a node. */
export function nSet(nodeId: number, controls: Record<string | number, number>): ServerMessage {
  return {
    address: "/n_set",
    nodeId,
    tail: Object.entries(controls).map(([k, v]) => [toControlId(k), toNumericValue(v)]),
  };
}

/** `/n_setn` — write a contiguous run of control values (the count is
 *  implied by the list length). */
export function nSetn(
  nodeId: number,
  control: string | number,
  values: readonly number[],
): ServerMessage {
  return {
    address: "/n_setn",
    nodeId,
    tail: [[toControlId(control), values.map(toNumericValue)]],
  };
}

/** `/n_run` — pause (0) / resume (1) one node. */
export function nRun(nodeId: number, flag: 0 | 1): ServerMessage {
  return { address: "/n_run", tail: [[nodeId, flag]] };
}

/** `/n_free` — free nodes. */
export function nFree(...nodeIds: number[]): ServerMessage {
  return { address: "/n_free", nodeIds };
}

/** `/g_freeAll` — free every node inside the groups (the groups survive). */
export function gFreeAll(...groupIds: number[]): ServerMessage {
  return { address: "/g_freeAll", groupIds };
}

/** `/d_recv` — install a compiled SynthDef, with an optional completion
 *  message executed once the def is ready (e.g. an embedded `/sync`). */
export function dRecv(bytes: Uint8Array, completionMsg?: Uint8Array): ServerMessage {
  return { address: "/d_recv", bufferOfData: bytes, completionMsg };
}

/** `/d_free` — remove SynthDef definitions by name. */
export function dFree(...names: string[]): ServerMessage {
  return { address: "/d_free", synthDefNames: names };
}

/** `/sync` — scsynth echoes `/synced <id>` once preceding async commands
 *  completed. */
export function sync(id: number): ServerMessage {
  return { address: "/sync", aUniqueNumber: id };
}

/** `/scope/subscribe` — sc-app bridge extension: register a scope-slot
 *  stream (answered with `/scope/chunk` replies). */
export function scopeSubscribe(params: {
  subId: number;
  scope: number;
  channels: number;
  chunkSize: number;
}): ServerMessage {
  return { address: "/scope/subscribe", ...params };
}

/** `/scope/unsubscribe` — sc-app bridge extension: drop a scope stream. */
export function scopeUnsubscribe(subId: number): ServerMessage {
  return { address: "/scope/unsubscribe", subId };
}

/** Escape hatch: a raw address + args outside the command catalogue. */
export function raw(address: string, ...args: Array<number | string | Uint8Array>): ServerMessage {
  return { address, args: args.map(toOscArg) };
}

/** `/dirt/play` — one Strudel/SuperDirt event as key/value pairs,
 *  flattened to SuperDirt's alternating arg list on the wire (sent inside
 *  a timetagged bundle, see `encodeBundle`). */
export function dirtPlay(event: Record<string, string | number>): ServerMessage {
  return {
    address: "/dirt/play",
    pairs: Object.entries(event).map(([key, value]): [string, OscArg] => [key, toOscArg(value)]),
  };
}
