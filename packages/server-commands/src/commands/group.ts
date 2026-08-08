/**
 * Group commands. Parallel groups (`/p_new`) live here too since
 * scsynth treats them like groups with a different dispatch mode.
 */

import type { OscArg, OscMessage } from "../types";

const message = (address: string, ...args: OscArg[]): OscMessage => ({ address, args });

// ── /g_new, /p_new ────────────────────────────────────────────────────

export const gNew = (...triples: ReadonlyArray<[number, number, number]>): OscMessage =>
  message("/g_new", ...triples.flat());

export const gNewOne = (groupId: number, addAction: number, targetId: number): OscMessage =>
  message("/g_new", groupId, addAction, targetId);

export const pNew = (...triples: ReadonlyArray<[number, number, number]>): OscMessage =>
  message("/p_new", ...triples.flat());

// ── /g_freeAll, /g_deepFree ───────────────────────────────────────────

export const gFreeAll = (...groupIds: number[]): OscMessage => message("/g_freeAll", ...groupIds);

export const gDeepFree = (...groupIds: number[]): OscMessage => message("/g_deepFree", ...groupIds);

// ── /g_head, /g_tail ──────────────────────────────────────────────────

export const gHead = (...pairs: ReadonlyArray<[number, number]>): OscMessage =>
  message("/g_head", ...pairs.flat());

export const gTail = (...pairs: ReadonlyArray<[number, number]>): OscMessage =>
  message("/g_tail", ...pairs.flat());

// ── /g_dumpTree, /g_queryTree ─────────────────────────────────────────

/** `/g_queryTree groupId withControls`. Reply arrives as
 *  `/g_queryTree.reply` (modelled as an `OscMessage` with that address). */
export const queryTree = (groupId: number, withControls = false): OscMessage =>
  message("/g_queryTree", groupId, withControls ? 1 : 0);

export const dumpTree = (groupId: number, withControls = false): OscMessage =>
  message("/g_dumpTree", groupId, withControls ? 1 : 0);
