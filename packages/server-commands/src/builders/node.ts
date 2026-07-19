import type { ServerMessage } from "../../pkg/scserver_commands.js";
import { toControlId, toNumericValue } from "./helpers.js";
/** `/n_after` — Place nodes after other nodes. */
export function nAfter(tail: ReadonlyArray<readonly [number, number]>): ServerMessage {
  return { address: "/n_after", args: { tail: tail.map((x) => [...x]) } };
}
/** `/n_before` — Place nodes before other nodes. */
export function nBefore(tail: ReadonlyArray<readonly [number, number]>): ServerMessage {
  return { address: "/n_before", args: { tail: tail.map((x) => [...x]) } };
}
/** `/n_fill` — Fill ranges of node controls. */
export function nFill(
  nodeId: number,
  tail: ReadonlyArray<readonly [string | number, number, number]>,
): ServerMessage {
  return {
    address: "/n_fill",
    args: { nodeId, tail: tail.map(([a, b, c]) => [toControlId(a), b, toNumericValue(c)]) },
  };
}
/** `/n_free` — Free nodes. */
export function nFree(...nodeIds: number[]): ServerMessage {
  return { address: "/n_free", args: { nodeIds } };
}
/** `/n_map` — Map controls to control buses. */
export function nMap(
  nodeId: number,
  tail: ReadonlyArray<readonly [string | number, number]>,
): ServerMessage {
  return { address: "/n_map", args: { nodeId, tail: tail.map(([a, b]) => [toControlId(a), b]) } };
}
/** `/n_mapa` — Map controls to audio buses. */
export function nMapa(
  nodeId: number,
  tail: ReadonlyArray<readonly [string | number, number]>,
): ServerMessage {
  return { address: "/n_mapa", args: { nodeId, tail: tail.map(([a, b]) => [toControlId(a), b]) } };
}
/** `/n_mapan` — Map control ranges to audio buses. */
export function nMapan(
  nodeId: number,
  tail: ReadonlyArray<readonly [string | number, number, number]>,
): ServerMessage {
  return {
    address: "/n_mapan",
    args: { nodeId, tail: tail.map(([a, b, c]) => [toControlId(a), b, c]) },
  };
}
/** `/n_mapn` — Map control ranges to control buses. */
export function nMapn(
  nodeId: number,
  tail: ReadonlyArray<readonly [string | number, number, number]>,
): ServerMessage {
  return {
    address: "/n_mapn",
    args: { nodeId, tail: tail.map(([a, b, c]) => [toControlId(a), b, c]) },
  };
}
/** `/n_order` — Reorder nodes. */
export function nOrder(
  addAction: number,
  targetId: number,
  nodeIds: readonly number[],
): ServerMessage {
  return { address: "/n_order", args: { addAction, targetId, nodeIds: [...nodeIds] } };
}
/** `/n_query` — Query node information. */
export function nQuery(nodeIds: readonly number[]): ServerMessage {
  return { address: "/n_query", args: { nodeIds: [...nodeIds] } };
}
/** `/n_run` — Pause or resume nodes. */
export function nRun(nodeId: number, flag: 0 | 1): ServerMessage {
  return { address: "/n_run", args: { tail: [[nodeId, flag]] } };
}
/** `/n_set` — Set scalar controls on a node. */
export function nSet(nodeId: number, controls: Record<string | number, number>): ServerMessage {
  return {
    address: "/n_set",
    args: {
      nodeId,
      tail: Object.entries(controls).map(([k, v]) => [toControlId(k), toNumericValue(v)]),
    },
  };
}
/** `/n_setn` — Set a contiguous run of controls. */
export function nSetn(
  nodeId: number,
  control: string | number,
  values: readonly number[],
): ServerMessage {
  return {
    address: "/n_setn",
    args: { nodeId, tail: [[toControlId(control), values.map(toNumericValue)]] },
  };
}
/** `/n_trace` — Trace nodes. */
export function nTrace(nodeIds: readonly number[]): ServerMessage {
  return { address: "/n_trace", args: { nodeIds: [...nodeIds] } };
}
