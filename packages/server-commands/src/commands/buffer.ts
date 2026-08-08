/**
 * Buffer commands. Allocation / read / write / query.
 */

import type { OscArg, OscMessage, OscPacket } from "../types";

const message = (address: string, ...args: OscArg[]): OscMessage => ({ address, args });

// ── /b_alloc[Read][Channel] ───────────────────────────────────────────

export const bAlloc = (
  bufnum: number,
  numFrames: number,
  numChannels = 1,
  completionMsg?: OscPacket,
): OscMessage =>
  completionMsg === undefined
    ? message("/b_alloc", bufnum, numFrames, numChannels)
    : message("/b_alloc", bufnum, numFrames, numChannels, completionMsg);

export const bAllocRead = (
  bufnum: number,
  path: string,
  startFrame = 0,
  numFrames = 0,
  completionMsg?: OscPacket,
): OscMessage =>
  completionMsg === undefined
    ? message("/b_allocRead", bufnum, path, startFrame, numFrames)
    : message("/b_allocRead", bufnum, path, startFrame, numFrames, completionMsg);

export const bAllocReadChannel = (
  bufnum: number,
  path: string,
  startFrame: number,
  numFrames: number,
  channels: readonly number[],
  completionMsg?: OscPacket,
): OscMessage => {
  const base: OscArg[] = [bufnum, path, startFrame, numFrames, ...channels];
  if (completionMsg !== undefined) base.push(completionMsg);
  return message("/b_allocReadChannel", ...base);
};

// ── /b_read[Channel] ──────────────────────────────────────────────────

export const bRead = (
  bufnum: number,
  path: string,
  startFrame = 0,
  numFrames = -1,
  bufStartFrame = 0,
  leaveOpen = 0,
  completionMsg?: OscPacket,
): OscMessage => {
  const base: OscArg[] = [bufnum, path, startFrame, numFrames, bufStartFrame, leaveOpen];
  if (completionMsg !== undefined) base.push(completionMsg);
  return message("/b_read", ...base);
};

export const bReadChannel = (
  bufnum: number,
  path: string,
  startFrame: number,
  numFrames: number,
  bufStartFrame: number,
  leaveOpen: number,
  channels: readonly number[],
  completionMsg?: OscPacket,
): OscMessage => {
  const base: OscArg[] = [
    bufnum,
    path,
    startFrame,
    numFrames,
    bufStartFrame,
    leaveOpen,
    ...channels,
  ];
  if (completionMsg !== undefined) base.push(completionMsg);
  return message("/b_readChannel", ...base);
};

// ── /b_write ──────────────────────────────────────────────────────────

export const bWrite = (
  bufnum: number,
  path: string,
  headerFormat: string,
  sampleFormat: string,
  numFrames = -1,
  startFrame = 0,
  leaveOpen = 0,
  completionMsg?: OscPacket,
): OscMessage => {
  const base: OscArg[] = [
    bufnum,
    path,
    headerFormat,
    sampleFormat,
    numFrames,
    startFrame,
    leaveOpen,
  ];
  if (completionMsg !== undefined) base.push(completionMsg);
  return message("/b_write", ...base);
};

// ── /b_free, /b_close, /b_zero ────────────────────────────────────────

export const bFree = (bufnum: number, completionMsg?: OscPacket): OscMessage =>
  completionMsg === undefined
    ? message("/b_free", bufnum)
    : message("/b_free", bufnum, completionMsg);

export const bClose = (bufnum: number, completionMsg?: OscPacket): OscMessage =>
  completionMsg === undefined
    ? message("/b_close", bufnum)
    : message("/b_close", bufnum, completionMsg);

export const bZero = (bufnum: number, completionMsg?: OscPacket): OscMessage =>
  completionMsg === undefined
    ? message("/b_zero", bufnum)
    : message("/b_zero", bufnum, completionMsg);

// ── /b_query ──────────────────────────────────────────────────────────

export const bQuery = (...bufnums: number[]): OscMessage => message("/b_query", ...bufnums);

// ── /b_set, /b_setn, /b_fill ──────────────────────────────────────────

export const bSet = (bufnum: number, ...pairs: ReadonlyArray<[number, number]>): OscMessage =>
  message("/b_set", bufnum, ...pairs.flat());

/** `/b_setn bufnum start numValues v1 v2 …` — one contiguous run. */
export const bSetn = (bufnum: number, start: number, values: readonly number[]): OscMessage =>
  message("/b_setn", bufnum, start, values.length, ...values);

export const bFill = (
  bufnum: number,
  ...ranges: ReadonlyArray<[number, number, number]>
): OscMessage => message("/b_fill", bufnum, ...ranges.flat());

// ── /b_get, /b_getn ───────────────────────────────────────────────────

export const bGet = (bufnum: number, ...indices: number[]): OscMessage =>
  message("/b_get", bufnum, ...indices);

/** `/b_getn bufnum start count` — single range. */
export const bGetn = (bufnum: number, start: number, count: number): OscMessage =>
  message("/b_getn", bufnum, start, count);

// ── /b_gen, /b_setSampleRate ──────────────────────────────────────────

export const bGen = (
  bufnum: number,
  command: string,
  flags: number,
  ...params: (number | string)[]
): OscMessage => message("/b_gen", bufnum, command, flags, ...params);

export const bSetSampleRate = (bufnum: number, sampleRate: number): OscMessage =>
  message("/b_setSampleRate", bufnum, sampleRate);
