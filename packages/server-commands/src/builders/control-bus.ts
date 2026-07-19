import type { ServerMessage } from "../../pkg/scserver_commands.js";
import { toNumericValue } from "./helpers.js";
/** `/c_fill` — Fill ranges of control buses. */
export function cFill(tail: ReadonlyArray<readonly [number, number, number]>): ServerMessage {
  return { address: "/c_fill", args: { tail: tail.map(([a, b, c]) => [a, b, toNumericValue(c)]) } };
}
/** `/c_get` — Get control bus values. */
export function cGet(busIndices: readonly number[]): ServerMessage {
  return { address: "/c_get", args: { busIndices: [...busIndices] } };
}
/** `/c_getn` — Get ranges of control buses. */
export function cGetn(tail: ReadonlyArray<readonly [number, number]>): ServerMessage {
  return { address: "/c_getn", args: { tail: tail.map((x) => [...x]) } };
}
/** `/c_set` — Set control bus values. */
export function cSet(tail: ReadonlyArray<readonly [number, number]>): ServerMessage {
  return { address: "/c_set", args: { tail: tail.map(([a, b]) => [a, toNumericValue(b)]) } };
}
/** `/c_setn` — Set contiguous control bus values. */
export function cSetn(tail: ReadonlyArray<readonly [number, readonly number[]]>): ServerMessage {
  return { address: "/c_setn", args: { tail: tail.map(([h, v]) => [h, v.map(toNumericValue)]) } };
}
