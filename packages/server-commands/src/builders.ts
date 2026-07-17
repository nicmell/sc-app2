/**
 * Builders for the commands the app actually speaks — each returns a plain
 * tagged `ServerMessage` value (the WIT variant encoding: `{tag, val}`) for
 * `encode`/`encodeBundle`. Argument inference mirrors the OSC typing the old
 * osc-js layer produced: integer numbers become int32, non-integers float32,
 * strings stay strings (a control-value string is a `c`/`a` bus mapping),
 * Uint8Array becomes a blob.
 */

import type {
  ControlId,
  ControlValue,
  NumericValue,
  ServerMessage,
} from "../pkg/interfaces/scserver-commands-commands.js";
import type { OscArg } from "../pkg/interfaces/scserver-commands-core.js";

// scsynth add actions (`/s_new`, `/g_new` addAction arg).
export const AddToHead = 0;
export const AddToTail = 1;
export const AddBefore = 2;
export const AddAfter = 3;
export const AddReplace = 4;

/** A control referenced by declared name or by index. */
export function toControlId(key: string | number): ControlId {
  return typeof key === "string" ? { tag: "name", val: key } : { tag: "index", val: key };
}

function toNumericValue(v: number): NumericValue {
  return Number.isInteger(v) ? { tag: "int", val: v } : { tag: "float", val: v };
}

/** A control value: number (int/float by integer-ness, as osc-js encoded
 *  them) or a `c`/`a`-prefixed bus-mapping symbol. */
function toControlValue(v: number | string): ControlValue {
  return typeof v === "string" ? { tag: "bus", val: v } : toNumericValue(v);
}

/** One variadic OSC arg for the `other` escape hatch. */
export function toOscArg(v: number | string | Uint8Array): OscArg {
  if (v instanceof Uint8Array) return { tag: "blob", val: v };
  if (typeof v === "string") return { tag: "string", val: v };
  return Number.isInteger(v) ? { tag: "int32", val: v } : { tag: "float32", val: v };
}

/** `/g_new` — create one group under `targetId`. */
export function gNew(groupId: number, addAction: number, targetId: number): ServerMessage {
  return { tag: "g-new", val: { tail: [[groupId, addAction, targetId]] } };
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
    tag: "s-new",
    val: {
      defName,
      nodeId,
      addAction,
      targetId,
      tail: pairs.map(([k, v]) => [toControlId(k), toControlValue(v)]),
    },
  };
}

/** `/n_set` — set named/indexed scalar controls on a node. */
export function nSet(nodeId: number, controls: Record<string | number, number>): ServerMessage {
  return {
    tag: "n-set",
    val: {
      nodeId,
      tail: Object.entries(controls).map(([k, v]) => [toControlId(k), toNumericValue(v)]),
    },
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
    tag: "n-setn",
    val: { nodeId, tail: [[toControlId(control), values.map(toNumericValue)]] },
  };
}

/** `/n_run` — pause (0) / resume (1) one node. */
export function nRun(nodeId: number, flag: 0 | 1): ServerMessage {
  return { tag: "n-run", val: { tail: [[nodeId, flag]] } };
}

/** `/n_free` — free nodes. */
export function nFree(...nodeIds: number[]): ServerMessage {
  return { tag: "n-free", val: { nodeIds: new Int32Array(nodeIds) } };
}

/** `/g_freeAll` — free every node inside the groups (the groups survive). */
export function gFreeAll(...groupIds: number[]): ServerMessage {
  return { tag: "g-free-all", val: { groupIds: new Int32Array(groupIds) } };
}

/** `/d_recv` — install a compiled SynthDef, with an optional completion
 *  message executed once the def is ready (e.g. an embedded `/sync`). */
export function dRecv(bytes: Uint8Array, completionMsg?: Uint8Array): ServerMessage {
  return { tag: "d-recv", val: { bufferOfData: bytes, completionMsg } };
}

/** `/d_free` — remove SynthDef definitions by name. */
export function dFree(...names: string[]): ServerMessage {
  return { tag: "d-free", val: { synthDefNames: names } };
}

/** `/sync` — scsynth echoes `/synced <id>` once preceding async commands
 *  completed. */
export function sync(id: number): ServerMessage {
  return { tag: "sync", val: { aUniqueNumber: id } };
}

/** `/scope/subscribe` — sc-app bridge extension: register a scope-slot
 *  stream (answered with `scope-chunk` replies). */
export function scopeSubscribe(params: {
  subId: number;
  scope: number;
  channels: number;
  chunkSize: number;
}): ServerMessage {
  return { tag: "scope-subscribe", val: params };
}

/** `/scope/unsubscribe` — sc-app bridge extension: drop a scope stream. */
export function scopeUnsubscribe(subId: number): ServerMessage {
  return { tag: "scope-unsubscribe", val: { subId } };
}

/** Escape hatch: a raw address + args outside the command catalogue. */
export function raw(address: string, ...args: Array<number | string | Uint8Array>): ServerMessage {
  return { tag: "other", val: { address, args: args.map(toOscArg) } };
}

/** `/dirt/play` — one Strudel/SuperDirt event as flattened key/value
 *  pairs (sent inside a timetagged bundle, see `encodeBundle`). */
export function dirtPlay(event: Record<string, string | number>): ServerMessage {
  return raw("/dirt/play", ...Object.entries(event).flat());
}
