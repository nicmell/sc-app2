import type { ServerMessage } from "../../pkg/scserver_commands.js";
/** `/g_deepFree` — Free all synths in groups and their subgroups. */
export function gDeepFree(groupIds: readonly number[]): ServerMessage {
  return { address: "/g_deepFree", args: { groupIds: [...groupIds] } };
}
/** `/g_dumpTree` — Print group trees. */
export function gDumpTree(tail: ReadonlyArray<readonly [number, number]>): ServerMessage {
  return { address: "/g_dumpTree", args: { tail: tail.map((x) => [...x]) } };
}
/** `/g_freeAll` — Free every node inside groups. */
export function gFreeAll(...groupIds: number[]): ServerMessage {
  return { address: "/g_freeAll", args: { groupIds } };
}
/** `/g_head` — Add nodes to the head of groups. */
export function gHead(tail: ReadonlyArray<readonly [number, number]>): ServerMessage {
  return { address: "/g_head", args: { tail: tail.map((x) => [...x]) } };
}
/** `/g_new` — Create one group under `targetId`. */
export function gNew(groupId: number, addAction: number, targetId: number): ServerMessage {
  return { address: "/g_new", args: { tail: [[groupId, addAction, targetId]] } };
}
/** `/g_queryTree` — Query group trees. */
export function gQueryTree(tail: ReadonlyArray<readonly [number, number]>): ServerMessage {
  return { address: "/g_queryTree", args: { tail: tail.map((x) => [...x]) } };
}
/** `/g_tail` — Add nodes to the tail of groups. */
export function gTail(tail: ReadonlyArray<readonly [number, number]>): ServerMessage {
  return { address: "/g_tail", args: { tail: tail.map((x) => [...x]) } };
}
/** `/p_new` — Create parallel groups. */
export function pNew(tail: ReadonlyArray<readonly [number, number, number]>): ServerMessage {
  return { address: "/p_new", args: { tail: tail.map((x) => [...x]) } };
}
