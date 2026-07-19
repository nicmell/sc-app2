import type { ServerMessage } from "../../pkg/scserver_commands.js";
import { toControlId, toControlValue } from "./helpers.js";
/** `/s_get` — Get synth control values. */
export function sGet(nodeId: number, controls: readonly (string | number)[]): ServerMessage {
  return { address: "/s_get", args: { nodeId, controls: controls.map(toControlId) } };
}
/** `/s_getn` — Get ranges of synth controls. */
export function sGetn(
  nodeId: number,
  tail: ReadonlyArray<readonly [string | number, number]>,
): ServerMessage {
  return { address: "/s_getn", args: { nodeId, tail: tail.map(([a, b]) => [toControlId(a), b]) } };
}
/** `/s_new` — Spawn a synth with control/value pairs. */
export function sNew(
  defName: string,
  nodeId: number,
  addAction: number,
  targetId: number,
  pairs: ReadonlyArray<readonly [string | number, number | string]> = [],
): ServerMessage {
  return {
    address: "/s_new",
    args: {
      defName,
      nodeId,
      addAction,
      targetId,
      tail: pairs.map(([k, v]) => [toControlId(k), toControlValue(v)]),
    },
  };
}
/** `/s_noid` — Auto-reassign synth IDs. */
export function sNoid(synthIds: readonly number[]): ServerMessage {
  return { address: "/s_noid", args: { synthIds: [...synthIds] } };
}
