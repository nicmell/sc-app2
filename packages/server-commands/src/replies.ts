/**
 * Typed positional accessors for common scsynth replies. Every reply
 * is a plain `OscMessage` at the type level — these helpers just
 * name the arg slots so callers don't write `msg.args[1]` inline.
 *
 * Unknown reply addresses fall through to raw `OscMessage` — inspect
 * `msg.address` and `msg.args` directly.
 */

import type { OscMessage } from "./types";

// ── Reply address constants ───────────────────────────────────────────

export const ADDR_DONE = "/done";
export const ADDR_FAIL = "/fail";
export const ADDR_LATE = "/late";
export const ADDR_STATUS_REPLY = "/status.reply";
export const ADDR_VERSION_REPLY = "/version.reply";
export const ADDR_SYNCED = "/synced";
export const ADDR_N_GO = "/n_go";
export const ADDR_N_END = "/n_end";
export const ADDR_N_ON = "/n_on";
export const ADDR_N_OFF = "/n_off";
export const ADDR_N_MOVE = "/n_move";
export const ADDR_N_INFO = "/n_info";
export const ADDR_TR = "/tr";
export const ADDR_B_INFO = "/b_info";
export const ADDR_B_SET = "/b_set";
export const ADDR_B_SETN = "/b_setn";
export const ADDR_C_SET = "/c_set";
export const ADDR_C_SETN = "/c_setn";
export const ADDR_G_QUERY_TREE_REPLY = "/g_queryTree.reply";
export const ADDR_N_QUERY_REPLY = "/n_query.reply";

// ── Typed accessors for the common cases ──────────────────────────────

/** `/tr nodeId trigId value` — SendTrig output. */
export const Tr = {
  address: ADDR_TR,
  nodeId: (m: OscMessage): number => m.args[0] as number,
  triggerId: (m: OscMessage): number => m.args[1] as number,
  value: (m: OscMessage): number => m.args[2] as number,
};

/** `/synced syncId`. */
export const Synced = {
  address: ADDR_SYNCED,
  syncId: (m: OscMessage): number => m.args[0] as number,
};

/** `/done /cmd [extras…]`. */
export const Done = {
  address: ADDR_DONE,
  commandAddress: (m: OscMessage): string => m.args[0] as string,
  extras: (m: OscMessage): ReadonlyArray<unknown> => m.args.slice(1),
};

/** `/fail /cmd errorString [extras…]`. */
export const Fail = {
  address: ADDR_FAIL,
  commandAddress: (m: OscMessage): string => m.args[0] as string,
  error: (m: OscMessage): string => m.args[1] as string,
  extras: (m: OscMessage): ReadonlyArray<unknown> => m.args.slice(2),
};

/** `/status.reply unused numUGens numSynths numGroups numSynthDefs
 *  avgCpu peakCpu nominalSampleRate actualSampleRate`. */
export const StatusReply = {
  address: ADDR_STATUS_REPLY,
  numUGens: (m: OscMessage): number => m.args[1] as number,
  numSynths: (m: OscMessage): number => m.args[2] as number,
  numGroups: (m: OscMessage): number => m.args[3] as number,
  numSynthDefs: (m: OscMessage): number => m.args[4] as number,
  avgCpu: (m: OscMessage): number => m.args[5] as number,
  peakCpu: (m: OscMessage): number => m.args[6] as number,
  nominalSampleRate: (m: OscMessage): number => m.args[7] as number,
  actualSampleRate: (m: OscMessage): number => m.args[8] as number,
};

/** `/n_go nodeId parent prev next isGroup [headId tailId]` — fired
 *  when a node is created (subscribed via `/notify 1`). The shape is
 *  the same for `/n_end /n_on /n_off /n_move /n_info`. */
export const NodeEvent = {
  nodeId: (m: OscMessage): number => m.args[0] as number,
  parentId: (m: OscMessage): number => m.args[1] as number,
  prevId: (m: OscMessage): number => m.args[2] as number,
  nextId: (m: OscMessage): number => m.args[3] as number,
  isGroup: (m: OscMessage): number => m.args[4] as number,
  headId: (m: OscMessage): number | undefined => m.args[5] as number | undefined,
  tailId: (m: OscMessage): number | undefined => m.args[6] as number | undefined,
};

/** `/b_setn.reply bufnum start numValues v1 v2 …` — wire-level
 *  response to `/b_getn`. */
export const BSetnReply = {
  address: ADDR_B_SETN,
  bufnum: (m: OscMessage): number => m.args[0] as number,
  start: (m: OscMessage): number => m.args[1] as number,
  samples: (m: OscMessage): Float32Array => {
    const count = m.args[2] as number;
    const out = new Float32Array(count);
    for (let i = 0; i < count; i++) out[i] = m.args[3 + i] as number;
    return out;
  },
};
